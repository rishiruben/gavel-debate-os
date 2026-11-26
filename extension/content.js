(() => {
  if (window.__GAVEL_OVERLAY_LOADED__) return;
  window.__GAVEL_OVERLAY_LOADED__ = true;

  const state = {
    active: false,
    leftName: 'Alex',
    rightName: 'Marcus',
    leftScore: 0,
    rightScore: 0,
    inputMode: 'captions', // 'captions' | 'mic'
    nextTurn: 'left',
    history: [],
  };

  let hostEl = null;
  let shadow = null;
  let frameEl = null;
  let leftTagEl = null;
  let rightTagEl = null;
  let popLeftEl = null;
  let popRightEl = null;
  let factBarEl = null;
  let factTextEl = null;
  let factTimer = null;

  let trackedVideo = null;
  let resizeObserver = null;
  let rafId = null;

  let recognition = null;
  let captionObserver = null;
  let lastCaptionText = '';
  let captionDebounce = null;
  let pendingEval = false;

  const CSS = `
    :host {
      all: initial;
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483646;
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
    }
    .frame {
      position: fixed;
      pointer-events: none;
      box-sizing: border-box;
      overflow: hidden;
    }
    .tag {
      position: absolute;
      bottom: 16px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 6px;
      background: rgba(9, 9, 11, 0.92);
      border: 1px solid #27272A;
      color: #E4E4E7;
      font-size: 13px;
      line-height: 1;
      font-weight: 500;
      letter-spacing: -0.01em;
    }
    .tag-left { left: 16px; }
    .tag-right { right: 16px; }
    .score {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      font-size: 13px;
    }
    .pos { color: #4ADE80; }
    .neg { color: #F87171; }
    .zero { color: #A1A1AA; }

    .pop-col {
      position: absolute;
      top: 48px;
      width: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .pop-left { left: 0; }
    .pop-right { right: 0; }

    @keyframes gavelCallout {
      0% { opacity: 0; transform: translateY(6px); }
      6% { opacity: 1; transform: translateY(0); }
      88% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-4px); }
    }
    .callout {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 6px;
      background: rgba(9, 9, 11, 0.94);
      border: 1px solid #27272A;
      color: #F4F4F5;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.2;
      animation: gavelCallout 3s ease-out forwards;
    }
    .fact-bar {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: inline-flex;
      align-items: center;
      gap: 8px;
      max-width: 68%;
      padding: 6px 12px;
      border-radius: 6px;
      background: rgba(9, 9, 11, 0.94);
      border: 1px solid #27272A;
      color: #F4F4F5;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.3;
      opacity: 0;
      transition: opacity 150ms ease-out;
    }
    .fact-bar.visible { opacity: 1; }
    .fact-icon {
      width: 14px;
      height: 14px;
      color: #38BDF8;
      flex-shrink: 0;
    }
    @media (prefers-reduced-motion: reduce) {
      .callout { animation: none; opacity: 1; transform: none; }
      .fact-bar { transition: none; }
    }
  `;

  function fmt(n) {
    return n > 0 ? `+${n}` : `${n}`;
  }

  function scoreClass(n) {
    if (n > 0) return 'score pos';
    if (n < 0) return 'score neg';
    return 'score zero';
  }

  function findPrimaryVideo() {
    const videos = Array.from(document.querySelectorAll('video'));
    let best = null;
    let bestArea = 0;
    for (const v of videos) {
      const r = v.getBoundingClientRect();
      const area = r.width * r.height;
      if (r.width >= 240 && r.height >= 140 && area > bestArea) {
        best = v;
        bestArea = area;
      }
    }
    return best;
  }

  function syncFrameBounds() {
    if (!frameEl) return;
    const video = findPrimaryVideo();
    if (video) {
      const r = video.getBoundingClientRect();
      frameEl.style.left = `${Math.round(r.left)}px`;
      frameEl.style.top = `${Math.round(r.top)}px`;
      frameEl.style.width = `${Math.round(r.width)}px`;
      frameEl.style.height = `${Math.round(r.height)}px`;
      if (video !== trackedVideo) {
        if (resizeObserver) resizeObserver.disconnect();
        trackedVideo = video;
        resizeObserver = new ResizeObserver(() => syncFrameBounds());
        resizeObserver.observe(video);
      }
    } else {
      frameEl.style.left = '0px';
      frameEl.style.top = '0px';
      frameEl.style.width = `${window.innerWidth}px`;
      frameEl.style.height = `${window.innerHeight}px`;
    }
  }

  function mountOverlay() {
    if (hostEl) return;
    hostEl = document.createElement('div');
    hostEl.id = 'gavel-overlay-root';
    shadow = hostEl.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = CSS;

    frameEl = document.createElement('div');
    frameEl.className = 'frame';

    popLeftEl = document.createElement('div');
    popLeftEl.className = 'pop-col pop-left';

    popRightEl = document.createElement('div');
    popRightEl.className = 'pop-col pop-right';

    leftTagEl = document.createElement('div');
    leftTagEl.className = 'tag tag-left';

    rightTagEl = document.createElement('div');
    rightTagEl.className = 'tag tag-right';

    factBarEl = document.createElement('div');
    factBarEl.className = 'fact-bar';
    factBarEl.innerHTML = `<svg class="fact-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    factTextEl = document.createElement('span');
    factBarEl.appendChild(factTextEl);

    frameEl.append(popLeftEl, popRightEl, leftTagEl, rightTagEl, factBarEl);
    shadow.append(style, frameEl);
    document.documentElement.appendChild(hostEl);

    renderScores();
    syncFrameBounds();
    window.addEventListener('resize', syncFrameBounds, { passive: true });
    window.addEventListener('scroll', syncFrameBounds, { passive: true });
    document.addEventListener('fullscreenchange', syncFrameBounds);
  }

  function unmountOverlay() {
    stopListening();
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    trackedVideo = null;
    window.removeEventListener('resize', syncFrameBounds);
    window.removeEventListener('scroll', syncFrameBounds);
    document.removeEventListener('fullscreenchange', syncFrameBounds);
    if (hostEl) {
      hostEl.remove();
      hostEl = null;
      shadow = null;
      frameEl = null;
    }
  }

  function renderScores() {
    if (!leftTagEl || !rightTagEl) return;
    leftTagEl.innerHTML = '';
    const lName = document.createElement('span');
    lName.textContent = state.leftName;
    const lVal = document.createElement('span');
    lVal.className = scoreClass(state.leftScore);
    lVal.textContent = fmt(state.leftScore);
    leftTagEl.append(lName, lVal);

    rightTagEl.innerHTML = '';
    const rVal = document.createElement('span');
    rVal.className = scoreClass(state.rightScore);
    rVal.textContent = fmt(state.rightScore);
    const rName = document.createElement('span');
    rName.textContent = state.rightName;
    rightTagEl.append(rVal, rName);
  }

  function showCallout(side, delta, reason) {
    const col = side === 'right' ? popRightEl : popLeftEl;
    if (!col) return;
    const chip = document.createElement('div');
    chip.className = 'callout';
    const d = document.createElement('span');
    d.className = scoreClass(delta);
    d.textContent = fmt(delta);
    const r = document.createElement('span');
    r.textContent = reason;
    chip.append(d, r);
    col.appendChild(chip);
    setTimeout(() => chip.remove(), 3100);
  }

  function showFact(text) {
    if (!factBarEl || !factTextEl || !text) return;
    factTextEl.textContent = text;
    factBarEl.classList.add('visible');
    clearTimeout(factTimer);
    factTimer = setTimeout(() => {
      if (factBarEl) factBarEl.classList.remove('visible');
    }, 4500);
  }

  async function processUtterance(text, explicitSide) {
    const trimmed = String(text || '').trim();
    if (trimmed.length < 18 || pendingEval || !state.active) return;

    const side = explicitSide || state.nextTurn;
    pendingEval = true;
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EVALUATE_UTTERANCE',
        payload: {
          text: trimmed,
          leftName: state.leftName,
          rightName: state.rightName,
          recentHistory: state.history,
          activeSide: side,
        },
      });

      state.history.push({
        speaker: side === 'left' ? state.leftName : state.rightName,
        text: trimmed,
      });
      if (state.history.length > 12) state.history.shift();
      state.nextTurn = side === 'left' ? 'right' : 'left';

      if (response?.ok && response.shouldScore) {
        if (response.speaker === 'right') state.rightScore += response.delta;
        else state.leftScore += response.delta;
        renderScores();
        showCallout(response.speaker, response.delta, response.reason);
        if (response.factCheck) showFact(response.factCheck);
      }
    } catch {
      // Extension context may reload
    } finally {
      pendingEval = false;
    }
  }

  function startMicCapture() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0]?.transcript || '';
          processUtterance(transcript);
        }
      }
    };
    recognition.onend = () => {
      if (state.active && state.inputMode === 'mic') {
        try { recognition.start(); } catch {}
      }
    };
    try { recognition.start(); } catch {}
  }

  function startCaptionCapture() {
    const readCaptions = () => {
      const segs = Array.from(document.querySelectorAll('.ytp-caption-segment, [data-testid="caption-segment"]'));
      if (!segs.length) return;
      const full = segs.map((el) => el.textContent || '').join(' ').replace(/\s+/g, ' ').trim();
      if (!full || full === lastCaptionText) return;
      lastCaptionText = full;
      clearTimeout(captionDebounce);
      captionDebounce = setTimeout(() => {
        if (lastCaptionText.length >= 24) {
          processUtterance(lastCaptionText);
        }
      }, 1400);
    };

    captionObserver = new MutationObserver(() => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        readCaptions();
      });
    });
    captionObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function stopListening() {
    if (recognition) {
      try { recognition.stop(); } catch {}
      recognition = null;
    }
    if (captionObserver) {
      captionObserver.disconnect();
      captionObserver = null;
    }
    clearTimeout(captionDebounce);
  }

  function startListening() {
    stopListening();
    if (!state.active) return;
    if (state.inputMode === 'mic') startMicCapture();
    else startCaptionCapture();
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_STATE') {
      sendResponse({ ...state });
      return;
    }

    if (msg.type === 'START_OVERLAY') {
      state.active = true;
      state.leftName = msg.payload?.leftName || state.leftName;
      state.rightName = msg.payload?.rightName || state.rightName;
      state.inputMode = msg.payload?.inputMode || state.inputMode;
      mountOverlay();
      renderScores();
      startListening();
      sendResponse({ ...state });
      return;
    }

    if (msg.type === 'STOP_OVERLAY') {
      state.active = false;
      unmountOverlay();
      sendResponse({ ...state });
      return;
    }

    if (msg.type === 'UPDATE_CONFIG') {
      if (msg.payload?.leftName) state.leftName = msg.payload.leftName;
      if (msg.payload?.rightName) state.rightName = msg.payload.rightName;
      if (msg.payload?.inputMode && msg.payload.inputMode !== state.inputMode) {
        state.inputMode = msg.payload.inputMode;
        if (state.active) startListening();
      }
      renderScores();
      sendResponse({ ...state });
      return;
    }

    if (msg.type === 'RESET_SCORES') {
      state.leftScore = 0;
      state.rightScore = 0;
      state.history = [];
      renderScores();
      sendResponse({ ...state });
      return;
    }

    if (msg.type === 'SEND_TEST_UTTERANCE') {
      processUtterance(msg.payload?.text || '', msg.payload?.side).then(() => {
        sendResponse({ ...state });
      });
      return true;
    }
  });
})();
