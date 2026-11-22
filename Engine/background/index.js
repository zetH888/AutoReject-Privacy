const defaults = { level: 'max', autoConfirm: true, legitimateInterest: true, notifications: false, localHistory: true, disabledHosts: [] };
chrome.runtime.onInstalled.addListener(async () => {
  const saved = await chrome.storage.local.get('settings');
  if (!saved.settings) await chrome.storage.local.set({ settings: defaults });
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'CONSENT_RESULT') return;
  (async () => {
    const {settings = defaults, history = []} = await chrome.storage.local.get(['settings', 'history']);
    if (settings.localHistory) {
      const entry = {host: (()=>{try{return new URL(sender.url || sender.tab?.url).hostname}catch{return 'unknown'}})(),
        status: message.status, adapter: message.adapter, at: new Date().toISOString()};
      await chrome.storage.local.set({history: [entry, ...history].slice(0, 200)});
    }
    sendResponse({ok:true});
  })().catch(()=>sendResponse({ok:false}));
  return true;
});
