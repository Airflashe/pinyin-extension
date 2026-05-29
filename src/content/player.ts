/**
 * TTS 播放模块：使用浏览器原生 Web Speech API 播读普通话发音
 */
let currentUtterance: SpeechSynthesisUtterance | null = null;

/** 确保语音已加载（Web Speech API 在 Chrome 中需要触发事件后才能 populate voices） */
async function ensureVoices(): Promise<SpeechSynthesisVoice[]> {
  const voices = speechSynthesis.getVoices();
  if (voices.length > 0) return voices;

  return new Promise((resolve) => {
    speechSynthesis.onvoiceschanged = () => {
      resolve(speechSynthesis.getVoices());
    };
  });
}

/** 选择最优的中文语音 */
async function pickVoice(): Promise<SpeechSynthesisVoice | null> {
  const voices = await ensureVoices();

  // 优先级：普通话 (zh-CN) > 台湾 (zh-TW) > 香港 (zh-HK) > 任何 zh-*
  for (const langPref of ['zh-CN', 'zh-TW', 'zh-HK']) {
    const match = voices.find(v => v.lang.startsWith(langPref) && v.localService);
    if (match) return match;
  }
  // fallback
  return voices.find(v => v.lang.startsWith('zh')) || null;
}

/**
 * 播读指定中文字词的普通话发音
 */
export async function speak(text: string): Promise<void> {
  // 取消当前正在播放的语音
  speechSynthesis.cancel();

  const voice = await pickVoice();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9;   // 稍慢，清晰
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  if (voice) {
    utterance.voice = voice;
  }

  currentUtterance = utterance;
  speechSynthesis.speak(utterance);
}

/** 取消当前播放 */
export function stopSpeaking(): void {
  speechSynthesis.cancel();
  currentUtterance = null;
}
