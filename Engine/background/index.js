const statuses = new Set(['rejected', 'submitted-unverified']);
const adapters = new Set(['OneTrust', 'Cookiebot', 'Didomi', 'Usercentrics', 'Opera']);
let historyQueue = Promise.resolve();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const clear = message?.type === 'CLEAR_HISTORY' &&
    sender.url === chrome.runtime.getURL('ui/popup.html');
  const consent = message?.type === 'CONSENT_RESULT' && sender.tab &&
    statuses.has(message.status) && adapters.has(message.adapter);
  if (!clear && !consent) return;

  const operation = historyQueue.then(async () => {
    if (clear) {
      await chrome.storage.local.remove('history');
      return;
    }
    const {settings, history = []} = await chrome.storage.local.get(['settings', 'history']);
    if (!settings?.localHistory) return;
    const url = new URL(sender.tab.url || sender.url);
    if (!['http:', 'https:'].includes(url.protocol)) return;
    const entry = {
      host: url.hostname, status: message.status,
      adapter: message.adapter, at: new Date().toISOString()
    };
    await chrome.storage.local.set({history: [entry, ...history].slice(0, 200)});
  });
  historyQueue = operation.catch(() => {});
  operation.then(() => sendResponse({ok: true}), () => sendResponse({ok: false}));
  return true;
});
