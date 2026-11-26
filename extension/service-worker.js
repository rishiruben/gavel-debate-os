const DEFAULT_BASE_URL = 'http://localhost:13305/api/v1';

function parseJsonResponse(raw) {
  const cleaned = String(raw || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('Invalid JSON from Lemonade');
  }
}

async function getConfig() {
  const stored = await chrome.storage.local.get(['lemonadeBaseUrl', 'lemonadeModel']);
  return {
    baseUrl: (stored.lemonadeBaseUrl || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    model: stored.lemonadeModel || 'auto',
  };
}

async function checkLemonade() {
  const { baseUrl, model } = await getConfig();
  const start = Date.now();
  try {
    const [healthRes, modelsRes] = await Promise.all([
      fetch(`${baseUrl}/health`).catch(() => null),
      fetch(`${baseUrl}/models`),
    ]);

    if (!modelsRes.ok) {
      return { connected: false, baseUrl, model: '', latencyMs: Date.now() - start, error: `HTTP ${modelsRes.status}` };
    }

    const modelsData = await modelsRes.json();
    const available = Array.isArray(modelsData.data) ? modelsData.data.map((m) => m.id) : [];

    let loadedModel = '';
    if (healthRes && healthRes.ok) {
      const healthData = await healthRes.json().catch(() => null);
      if (healthData?.model_loaded) loadedModel = healthData.model_loaded;
    }

    const activeModel = model !== 'auto' ? model : loadedModel || available[0] || '';
    return {
      connected: true,
      baseUrl,
      model: activeModel,
      available,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      connected: false,
      baseUrl,
      model: '',
      latencyMs: Date.now() - start,
      error: err?.message || 'Unreachable',
    };
  }
}

async function evaluateUtterance({ text, leftName, rightName, recentHistory = [], activeSide = 'left' }) {
  const status = await checkLemonade();
  if (!status.connected || !status.model) {
    return { ok: false, error: 'Lemonade Server offline' };
  }

  const historyBlock = recentHistory.length
    ? recentHistory.slice(-6).map((h) => `${h.speaker}: ${h.text}`).join('\n')
    : 'None';

  const systemPrompt =
    'You are a fast, impartial live conversation referee for a minimalist stream overlay. ' +
    'Score substantive moves with small integers: +2 (strong direct rebuttal or decisive evidence), +1 (clear point, fair concession, or cited stat), -1 (dodged question, interruption, or weak deflection), -2 (clear strawman or bad-faith personal attack). ' +
    'If the utterance is small talk, filler, or incomplete, set shouldScore to false. ' +
    'Return strict JSON only.';

  const userPrompt = `Speakers:
- left: ${leftName}
- right: ${rightName}

Recent transcript:
${historyBlock}

Latest utterance (attributed to ${activeSide === 'left' ? leftName : rightName}):
"${text}"

Return strict JSON:
{
  "shouldScore": true or false,
  "speaker": "left" or "right",
  "delta": -2 | -1 | 1 | 2,
  "reason": "2 to 4 words, sentence case, no punctuation",
  "factCheck": "1 concise sentence ONLY if a verifiable factual/numeric claim was made, otherwise null"
}`;

  try {
    const res = await fetch(`${status.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer lemonade',
      },
      body: JSON.stringify({
        model: status.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 768,
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || '';
    const parsed = parseJsonResponse(content);

    const delta = Number(parsed.delta);
    const clampedDelta = [-2, -1, 1, 2].includes(delta) ? delta : delta > 0 ? 1 : -1;

    return {
      ok: true,
      model: status.model,
      shouldScore: Boolean(parsed.shouldScore),
      speaker: parsed.speaker === 'right' ? 'right' : 'left',
      delta: clampedDelta,
      reason: String(parsed.reason || 'Key point').slice(0, 36),
      factCheck: typeof parsed.factCheck === 'string' && parsed.factCheck.trim() ? parsed.factCheck.trim().slice(0, 110) : null,
    };
  } catch (err) {
    return { ok: false, error: err?.message || 'Evaluation failed' };
  }
}

async function ensureInjected(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => Boolean(window.__GAVEL_OVERLAY_LOADED__),
  });
  const alreadyLoaded = results?.[0]?.result;
  if (!alreadyLoaded) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === 'CHECK_LEMONADE') {
        sendResponse(await checkLemonade());
        return;
      }

      if (message.type === 'EVALUATE_UTTERANCE') {
        sendResponse(await evaluateUtterance(message.payload));
        return;
      }

      if (message.type === 'ENSURE_INJECTED') {
        await ensureInjected(message.tabId);
        sendResponse({ ok: true });
        return;
      }

      sendResponse({ ok: false, error: 'Unknown message type' });
    } catch (err) {
      sendResponse({ ok: false, error: err?.message || 'Service worker error' });
    }
  })();
  return true;
});
