import { collectTextNodes } from '../utils/chinese';
import { annotateTextNodes, annotateTextNodePartial } from './annotator';
import { speak, stopSpeaking } from './player';

// ============================================
// 全局状态
// ============================================
let annotated = false;

// ============================================
// 核心：标注全页
// ============================================
function annotatePage(root: Node = document.body): void {
  const textNodes = collectTextNodes(root);
  const result = annotateTextNodes(textNodes);
  annotated = true;
  console.log(`[Pinyin] 标注完成：${result.nodesProcessed} 个节点，${result.charsAnnotated} 字`);
}

// ============================================
// 核心：移除所有标注（恢复原状）
// ============================================
function removeAnnotations(root: ParentNode = document.body): void {
  const rubies = root.querySelectorAll('ruby.pinyin-ruby');
  for (const ruby of rubies) {
    // 只遍历 ruby 的直接子节点，避免递归到 rb/rt 内部造成重复收集
    const textParts: string[] = [];
    for (const child of Array.from(ruby.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName === 'RB') {
        textParts.push(child.textContent || '');
      } else if (child.nodeType === Node.TEXT_NODE) {
        textParts.push(child.textContent || '');
      }
    }
    const parent = ruby.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(textParts.join('')), ruby);
    }
  }
  annotated = false;
  console.log('[Pinyin] 标注已移除');
}

// ============================================
// 事件委托：点击拼音 → 发音
// ============================================
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (!target.classList.contains('pinyin-rt')) return;

  e.preventDefault();
  e.stopPropagation();

  const hanChar = target.getAttribute('data-han');
  if (!hanChar) return;

  // 视觉反馈：高亮当前拼音
  const allRt = document.querySelectorAll('rt.pinyin-playing');
  allRt.forEach(rt => rt.classList.remove('pinyin-playing'));
  target.classList.add('pinyin-playing');

  speak(hanChar).finally(() => {
    target.classList.remove('pinyin-playing');
  });
});

// ============================================
// 消息监听：popup / background 发来的指令
// ============================================
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.action) {
    case 'toggle':
      if (annotated) {
        removeAnnotations();
      } else {
        annotatePage();
      }
      sendResponse({ status: annotated ? 'annotated' : 'removed' });
      break;

    case 'annotate':
      annotatePage();
      sendResponse({ status: 'annotated' });
      break;

    case 'remove':
      removeAnnotations();
      sendResponse({ status: 'removed' });
      break;

    case 'status':
      sendResponse({ annotated });
      break;

    case 'annotateSelection':
      annotateSelection(message.text);
      sendResponse({ status: 'selection_annotated' });
      break;

    case 'speakSelection':
      speak(message.text);
      sendResponse({ status: 'spoken' });
      break;

    default:
      sendResponse({ error: 'unknown action' });
  }
  return true; // 保持通道开启以支持异步响应
});

// ============================================
// 选中文字标注（通过弹窗注入）
// ============================================
function annotateSelection(text: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  // 精确处理选区中的每个文本节点（含偏移量）
  annotateRange(range);
}

/**
 * 精确标注 Range 范围内的汉字
 *
 * 使用 startContainer/startOffset/endContainer/endOffset 精确定位，
 * 只标注选中部分的汉字，不影响文本节点的其他部分。
 */
function annotateRange(range: Range): void {
  const startNode = range.startContainer;
  const endNode = range.endContainer;

  // 情况 1：选区完全位于同一文本节点内
  if (startNode === endNode && startNode.nodeType === Node.TEXT_NODE) {
    annotateTextNodePartial(
      startNode as Text,
      range.startOffset,
      range.endOffset,
    );
    return;
  }

  // 情况 2：选区跨多个节点，收集所有相交的文本节点并精确处理
  const commonAncestor = range.commonAncestorContainer;

  // 收集 commonAncestor 下所有与选区相交的文本节点
  const textNodes = collectAllTextNodesInRange(commonAncestor, range);

  for (const node of textNodes) {
    if (node === startNode && node.nodeType === Node.TEXT_NODE) {
      // 起始节点：从 startOffset 到末尾
      annotateTextNodePartial(
        node as Text,
        range.startOffset,
        (node as Text).textContent?.length ?? 0,
      );
    } else if (node === endNode && node.nodeType === Node.TEXT_NODE) {
      // 结束节点：从开头到 endOffset
      annotateTextNodePartial(node as Text, 0, range.endOffset);
    } else {
      // 中间节点：全部标注
      annotateTextNodePartial(
        node as Text,
        0,
        (node as Text).textContent?.length ?? 0,
      );
    }
  }
}

/** 收集 commonAncestor 下所有与 Range 相交的文本节点（按文档序） */
function collectAllTextNodesInRange(root: Node, range: Range): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Text) {
      // 跳过不应处理的节点
      if (!node.textContent) return NodeFilter.FILTER_REJECT;

      // 检查节点是否与选区相交
      const nodeRange = document.createRange();
      nodeRange.selectNodeContents(node);

      // 使用 DOM 比较：node 的末尾在 range 的开始之后，且 node 的开始在 range 的末尾之前
      const intersects =
        range.compareBoundaryPoints(Range.START_TO_END, nodeRange) < 0 &&
        range.compareBoundaryPoints(Range.END_TO_START, nodeRange) > 0;

      return intersects ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    nodes.push(node);
  }
  return nodes;
}

// ============================================
// MutationObserver：监听动态内容
// ============================================
const observer = new MutationObserver((mutations) => {
  if (!annotated) return;

  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const textNodes = collectTextNodes(node);
        annotateTextNodes(textNodes);
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// ============================================
// 初始状态同步
// ============================================
chrome.storage.local.get('annotated', (data) => {
  if (data.annotated) {
    annotatePage();
  }
});