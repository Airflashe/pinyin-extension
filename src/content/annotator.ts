import { toPinyin } from './converter';
import { findChineseRanges, isChineseChar } from '../utils/chinese';

/**
 * 将单个文本节点中的汉字替换为 <ruby> 拼音标注
 * 使用范围替换策略，避免重复遍历
 */
export function annotateTextNode(textNode: Text): boolean {
  const text = textNode.textContent;
  if (!text) return false;

  const ranges = findChineseRanges(text);
  if (ranges.length === 0) return false;

  const fragment = document.createDocumentFragment();
  let cursor = 0;

  for (const range of ranges) {
    // 前面的非汉字部分
    if (range.start > cursor) {
      fragment.appendChild(document.createTextNode(text.slice(cursor, range.start)));
    }

    // 汉字段：创建 ruby 标签
    const hanText = text.slice(range.start, range.end);
    const ruby = document.createElement('ruby');
    ruby.className = 'pinyin-ruby';

    // 逐字创建 rb + rt 对，确保拼音与汉字一一对应
    for (let i = 0; i < hanText.length; i++) {
      const char = hanText[i];
      if (isChineseChar(char)) {
        const pinyinText = toPinyin(char);

        // rb: 汉字基底
        const rb = document.createElement('rb');
        rb.className = 'pinyin-han';
        rb.textContent = char;
        ruby.appendChild(rb);

        // rt: 拼音标注
        const rt = document.createElement('rt');
        rt.className = 'pinyin-rt';
        rt.textContent = pinyinText;
        rt.setAttribute('data-pinyin', pinyinText);
        rt.setAttribute('data-han', char);
        ruby.appendChild(rt);
      } else {
        // 汉字段中混入的非汉字（如标点）
        ruby.appendChild(document.createTextNode(char));
      }
    }

    fragment.appendChild(ruby);
    cursor = range.end;
  }

  // 尾部剩余的非汉字部分
  if (cursor < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(cursor)));
  }

  textNode.parentNode?.replaceChild(fragment, textNode);
  return true;
}

/**
 * 对文本节点中的 [startOffset, endOffset) 区间进行拼音标注
 * 只标注该区间内的汉字，区间外的文本保持不变
 *
 * 返回 true 表示成功标注了至少一个汉字
 */
export function annotateTextNodePartial(
  textNode: Text,
  startOffset: number,
  endOffset: number,
): boolean {
  const fullText = textNode.textContent;
  if (!fullText) return false;

  const length = fullText.length;
  // 限制到有效范围
  const start = Math.max(0, Math.min(startOffset, length));
  const end = Math.max(start, Math.min(endOffset, length));
  if (start >= end) return false;

  const midText = fullText.slice(start, end);
  const ranges = findChineseRanges(midText);
  if (ranges.length === 0) return false;

  const fragment = document.createDocumentFragment();

  // 前部：区间之前的文本（保持原样）
  if (start > 0) {
    fragment.appendChild(document.createTextNode(fullText.slice(0, start)));
  }

  // 中部：区间内的文本，对汉字段进行标注
  let cursor = 0;
  for (const range of ranges) {
    // 区间内非汉字部分（保持原样）
    if (range.start > cursor) {
      fragment.appendChild(document.createTextNode(midText.slice(cursor, range.start)));
    }

    // 汉字段：创建 ruby 标注
    const hanText = midText.slice(range.start, range.end);
    const ruby = document.createElement('ruby');
    ruby.className = 'pinyin-ruby';

    for (let i = 0; i < hanText.length; i++) {
      const char = hanText[i];
      if (isChineseChar(char)) {
        const pinyinText = toPinyin(char);

        const rb = document.createElement('rb');
        rb.className = 'pinyin-han';
        rb.textContent = char;
        ruby.appendChild(rb);

        const rt = document.createElement('rt');
        rt.className = 'pinyin-rt';
        rt.textContent = pinyinText;
        rt.setAttribute('data-pinyin', pinyinText);
        rt.setAttribute('data-han', char);
        ruby.appendChild(rt);
      } else {
        ruby.appendChild(document.createTextNode(char));
      }
    }

    fragment.appendChild(ruby);
    cursor = range.end;
  }

  // 中部剩余的非汉字部分
  if (cursor < midText.length) {
    fragment.appendChild(document.createTextNode(midText.slice(cursor)));
  }

  // 后部：区间之后的文本（保持原样）
  if (end < length) {
    fragment.appendChild(document.createTextNode(fullText.slice(end)));
  }

  textNode.parentNode?.replaceChild(fragment, textNode);
  return true;
}

/** 标注统计 */
export interface AnnotateResult {
  nodesProcessed: number;
  charsAnnotated: number;
}

/** 批量标注一组文本节点 */
export function annotateTextNodes(textNodes: Text[]): AnnotateResult {
  let nodesProcessed = 0;
  let charsAnnotated = 0;

  for (const node of textNodes) {
    const originalLen = node.textContent?.length ?? 0;
    if (annotateTextNode(node)) {
      nodesProcessed++;
      charsAnnotated += originalLen;
    }
  }

  return { nodesProcessed, charsAnnotated };
}