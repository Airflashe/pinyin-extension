/**
 * 检测字符是否为汉字（CJK 统一表意文字）
 */
export function isChineseChar(ch: string): boolean {
  const cp = ch.codePointAt(0);
  if (cp === undefined) return false;
  // CJK 统一表意文字基本区（U+4E00–U+9FFF）
  // CJK 扩展 A 区（U+3400–U+4DBF）
  return (cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0x3400 && cp <= 0x4dbf);
}

/**
 * 检查文本节点是否包含至少一个汉字
 */
export function containsChinese(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (isChineseChar(text[i])) return true;
  }
  return false;
}

/**
 * 提取文本中连续的汉字段，返回 {start, end} 数组
 */
export function findChineseRanges(text: string): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  let inRange = false;
  let start = 0;

  for (let i = 0; i < text.length; i++) {
    if (isChineseChar(text[i])) {
      if (!inRange) {
        start = i;
        inRange = true;
      }
    } else {
      if (inRange) {
        ranges.push({ start, end: i });
        inRange = false;
      }
    }
  }
  if (inRange) {
    ranges.push({ start, end: text.length });
  }
  return ranges;
}

/** 不应被处理的标签名 */
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT',
  'INPUT', 'TEXTAREA', 'SELECT', 'OPTION',
  'SVG', 'MATH', 'CANVAS', 'VIDEO', 'AUDIO',
  'CODE', 'PRE', 'KBD', 'VAR',
]);

/** 不应遍历的父节点类名前缀 */
const SKIP_CLASS_PREFIXES = ['pinyin-'];

/**
 * 判断节点及其祖先是否应跳过拼音标注
 */
export function shouldSkipNode(node: Node): boolean {
  let current: Node | null = node;
  while (current) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as HTMLElement;

      // 跳过特定标签
      if (SKIP_TAGS.has(el.tagName)) return true;

      // 跳过已有 ruby 标注
      if (el.tagName === 'RUBY') return true;

      // 跳过带 pinyin- 前缀的类名（自身标注的内容）
      const className = el.className;
      if (typeof className === 'string') {
        for (const prefix of SKIP_CLASS_PREFIXES) {
          if (className.includes(prefix)) return true;
        }
      }

      // 跳过 contenteditable
      if (el.getAttribute('contenteditable') === 'true') return true;

      // 跳过暗藏的节点
      const display = getComputedStyle(el).display;
      if (display === 'none') return true;
    }
    current = current.parentNode;
  }
  return false;
}

/** 收集页面中所有可处理的文本节点 */
export function collectTextNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Text) {
      if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
      if (!node.textContent || !containsChinese(node.textContent)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    nodes.push(node);
  }
  return nodes;
}
