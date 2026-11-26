const statusEl = document.getElementById('lemonade-status');
const leftInput = document.getElementById('left-name');
const rightInput = document.getElementById('right-name');
const modeSelect = document.getElementById('input-mode');
const toggleBtn = document.getElementById('toggle-overlay');
const resetBtn = document.getElementById('reset-scores');
const manualForm = document.getElementById('manual-form');
const manualInput = document.getElementById('manual-input');
const manualSend = document.getElementById('manual-send');
const errorEl = document.getElementById('error-msg');

let overlayActive = false;

function showError(msg) {
  if (!msg) {
    errorEl.hidden = true;
    errorEl.textContent = '';
  } else {
    errorEl.hidden = false;
    errorEl.textContent = msg;
  }
}

function updateToggleUI() {
  toggleBtn.textContent = overlayActive ? 'Stop overlay' : 'Start overlay';
  toggleBtn.classList.toggle('active', overlayActive);
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToTab(message) {
  const tab = await getActiveTab();
  if (!tab?.id) throw new Error('No active browser tab');
  await chrome.runtime.sendMessage({ type: 'ENSURE_INJECTED', tabId: tab.id });
  return await chrome.tabs.sendMessage(tab.id, message);
}

async function init() {
  const saved = await chrome.storage.local.get(['leftName', 'rightName', 'inputMode']);
  if (saved.leftName) leftInput.value = saved.leftName;
  if (saved.rightName) rightInput.value = saved.rightName;
  if (saved.inputMode) modeSelect.value = saved.inputMode;

  const health = await chrome.runtime.sendMessage({ type: 'CHECK_LEMONADE' });
  if (health?.connected) {
    statusEl.textContent = health.model || 'Connected';
    statusEl.className = 'status ok';
  } else {
    statusEl.textContent = 'Offline';
    statusEl.className = 'status err';
  }

  try {
    const tab = await getActiveTab();
    if (tab?.id && tab.url && !tab.url.startsWith('chrome://')) {
      const state = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATE' }).catch(() => null);
      if (state) {
        overlayActive = Boolean(state.active);
        leftInput.value = state.leftName || leftInput.value;
        rightInput.value = state.rightName || rightInput.value;
        modeSelect.value = state.inputMode || modeSelect.value;
        updateToggleUI();
      }
    }
  } catch {
    // Tab not injected yet
  }
}

async function persistAndSync() {
  const payload = {
    leftName: leftInput.value.trim() || 'Alex',
    rightName: rightInput.value.trim() || 'Marcus',
    inputMode: modeSelect.value,
  };
  await chrome.storage.local.set(payload);
  if (overlayActive) {
    await sendToTab({ type: 'UPDATE_CONFIG', payload }).catch(() => {});
  }
}

leftInput.addEventListener('change', persistAndSync);
rightInput.addEventListener('change', persistAndSync);
modeSelect.addEventListener('change', persistAndSync);

toggleBtn.addEventListener('click', async () => {
  showError('');
  try {
    const payload = {
      leftName: leftInput.value.trim() || 'Alex',
      rightName: rightInput.value.trim() || 'Marcus',
      inputMode: modeSelect.value,
    };
    await chrome.storage.local.set(payload);

    if (overlayActive) {
      await sendToTab({ type: 'STOP_OVERLAY' });
      overlayActive = false;
    } else {
      await sendToTab({ type: 'START_OVERLAY', payload });
      overlayActive = true;
    }
    updateToggleUI();
  } catch (err) {
    showError('Open a regular web page (YouTube, Twitch, Meet) before starting the overlay.');
  }
});

resetBtn.addEventListener('click', async () => {
  showError('');
  try {
    if (overlayActive) {
      await sendToTab({ type: 'RESET_SCORES' });
    }
  } catch {
    // Ignore if not mounted
  }
});

manualForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = manualInput.value.trim();
  if (!text) return;
  showError('');
  manualSend.disabled = true;
  manualSend.textContent = '...';
  try {
    if (!overlayActive) {
      await sendToTab({
        type: 'START_OVERLAY',
        payload: {
          leftName: leftInput.value.trim() || 'Alex',
          rightName: rightInput.value.trim() || 'Marcus',
          inputMode: modeSelect.value,
        },
      });
      overlayActive = true;
      updateToggleUI();
    }
    await sendToTab({ type: 'SEND_TEST_UTTERANCE', payload: { text } });
    manualInput.value = '';
  } catch {
    showError('Open a regular web page to score on the overlay.');
  } finally {
    manualSend.disabled = false;
    manualSend.textContent = 'Score';
  }
});

init();
