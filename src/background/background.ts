// ============================================
// Pilot Extension — Background Service Worker
// ============================================

// 右键菜单 ID
const MENU_ANNOTATE = 'pinyin-annotate-selection';
const MENU_READ = 'pinyin-read-selection';

// 安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ANNOTATE,
    title: '标注拼音',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: MENU_READ,
    title: '朗读发音',
    contexts: ['selection'],
  });
});

// 右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  const selectionText = info.selectionText;
  if (!selectionText) return;

  switch (info.menuItemId) {
    case MENU_ANNOTATE:
      chrome.tabs.sendMessage(tab.id, {
        action: 'annotateSelection',
        text: selectionText,
      });
      break;

    case MENU_READ:
      chrome.tabs.sendMessage(tab.id, {
        action: 'speakSelection',
        text: selectionText,
      });
      break;
  }
});

// 点击扩展图标时切换标注状态
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;

  chrome.tabs.sendMessage(tab.id, { action: 'toggle' }, (response) => {
    const status = response?.status === 'annotated';
    chrome.action.setBadgeText({ text: status ? 'ON' : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#e65100' });
  });
});

// 监听存储变化，同步图标 badge
chrome.storage.onChanged.addListener((changes) => {
  if (changes.annotated) {
    const status = changes.annotated.newValue;
    chrome.action.setBadgeText({ text: status ? 'ON' : '' });
  }
});
