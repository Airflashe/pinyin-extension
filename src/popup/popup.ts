// ============================================
// Pinyin Extension — Popup Controller
// ============================================

const btnToggle = document.getElementById('btn-toggle')!;
const btnIcon = document.getElementById('btn-icon')!;
const btnLabel = document.getElementById('btn-label')!;
const statusDot = document.getElementById('status-dot')!;
const statusText = document.getElementById('status-text')!;

let isAnnotated = false;

// 初始状态查询
async function queryStatus(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;

  chrome.tabs.sendMessage(tab.id, { action: 'status' }, (response) => {
    if (chrome.runtime.lastError) {
      statusText.textContent = '无法获取状态（请刷新页面）';
      return;
    }
    isAnnotated = response?.annotated ?? false;
    updateUI();
  });
}

// 更新 UI 状态
function updateUI(): void {
  if (isAnnotated) {
    btnIcon.textContent = '❌';
    btnLabel.textContent = '移除标注';
    statusDot.className = 'status-dot status-on';
    statusText.textContent = '已标注';
  } else {
    btnIcon.textContent = '📝';
    btnLabel.textContent = '标注全页';
    statusDot.className = 'status-dot status-off';
    statusText.textContent = '未标注';
  }
}

// 切换标注
btnToggle.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;

  chrome.tabs.sendMessage(tab.id, { action: 'toggle' }, (response) => {
    if (chrome.runtime.lastError) {
      statusText.textContent = '操作失败（请刷新页面）';
      return;
    }
    isAnnotated = response?.status === 'annotated';
    updateUI();

    // 同步 storage
    chrome.storage.local.set({ annotated: isAnnotated });
  });
});

// 初始化
queryStatus();
