import { pinyin } from 'pinyin-pro';

/**
 * 将汉字文本转换为带声调的拼音
 * 使用 pinyin-pro 的词语级识别处理多音字
 */
export function toPinyin(text: string): string {
  if (!text) return '';
  try {
    return pinyin(text, {
      toneType: 'symbol', // 带声调符号
      type: 'array',      // 返回数组，按字拆分
    }).join(' ');
  } catch {
    return text;
  }
}

/**
 * 逐个汉字转换为拼音数组
 */
export function toPinyinArray(text: string): string[] {
  if (!text) return [];
  try {
    return pinyin(text, {
      toneType: 'symbol',
      type: 'array',
    }) as string[];
  } catch {
    return text.split('').map(() => '');
  }
}
