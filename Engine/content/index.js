(() => {
  'use strict';

  const defaults = {
    level: 'max', autoConfirm: true, legitimateInterest: true,
    notifications: false, localHistory: false, disabledHosts: []
  };
  const adapters = [
    {name: 'OneTrust', root: '#onetrust-banner-sdk, #onetrust-pc-sdk', reject: '#onetrust-reject-all-handler, .ot-pc-refuse-all-handler'},
    {name: 'Cookiebot', root: '#CybotCookiebotDialog', reject: '#CybotCookiebotDialogBodyButtonDecline'},
    {name: 'Didomi', root: '#didomi-host', reject: '#didomi-notice-disagree-button, .didomi-components-button--disagree'},
    {name: 'Usercentrics', root: '#usercentrics-root, [data-testid="uc-container"]', reject: '[data-testid="uc-deny-all-button"]'}
  ];
  const rejectLabel = /^(reject all|reject optional|decline all|deny all|refuse all|odrzuć wszystkie|odrzuć opcjonalne|alle ablehnen|tout refuser|rechazar (todo|todas))$/i;
  const didomiChoices = '.didomi-consent-popup-data-processing__buttons_tcf_v2 [role="radiogroup"]';
  const consentLabels = /^(nie akceptuję|disagree|i disagree|do not agree)$/i;
  const acceptLabels = /^(akceptuję|agree|i agree|accept)$/i;
  const objectionLabels = /^(sprzeciwiam się|zgłaszam sprzeciw|object|i object)$/i;
  const allowInterestLabels = /^(nie zgłaszam sprzeciwu|nie sprzeciwiam się|do not object|i do not object)$/i;
  if (window.__autoRejectPrivacyLoaded) return;
  window.__autoRejectPrivacyLoaded = true;

  let settings = defaults;
  let timer;
  let verificationPending = false;
  const attempts = new WeakSet();
  const managedDidomi = new WeakSet();

  function siteHost() {
    if (window.top === window || !window.top) return location.hostname;
    const ancestor = location.ancestorOrigins;
    try {
      return new URL(ancestor[ancestor.length - 1]).hostname;
    } catch {
      return '';
    }
  }

  const visible = element => Boolean(element?.getClientRects().length) &&
    getComputedStyle(element).visibility === 'visible';
  const enabled = element => visible(element) &&
    !element.matches(':disabled, [aria-disabled="true"]');
  const label = element => (element.innerText || element.textContent || element.getAttribute('aria-label') || '')
    .replace(/\s+/g, ' ').trim();

  function report(status, adapter) {
    chrome.runtime.sendMessage({type: 'CONSENT_RESULT', status, adapter}).catch(() => {});
  }

  function cookieBotRejected() {
    const entry = document.cookie.split(/;\s*/).find(cookie => cookie.startsWith('CookieConsent='));
    if (!entry) return false;
    try {
      const value = decodeURIComponent(entry.slice('CookieConsent='.length));
      return ['preferences', 'statistics', 'marketing'].every(category =>
        new RegExp('(?:^|[,{])\\s*["\']?' + category + '["\']?\\s*:\\s*false\\s*(?=[,}])', 'i').test(value)
      );
    } catch {
      return false;
    }
  }

  function submit(button, adapter) {
    if (!enabled(button) || attempts.has(button)) return false;
    attempts.add(button);
    verificationPending = true;
    button.click();
    setTimeout(() => {
      report(adapter === 'Cookiebot' && cookieBotRejected() ? 'rejected' : 'submitted-unverified', adapter);
      verificationPending = false;
      schedule();
    }, 700);
    return true;
  }

  function didomiChoice(group) {
    const radios = [...group.querySelectorAll('button[role="radio"]')].filter(visible);
    if (radios.length !== 2 || !radios.every(radio => /^(true|false)$/.test(radio.getAttribute('aria-checked')))) return null;
    if (radios.some(radio => acceptLabels.test(label(radio)))) {
      return radios.find(radio => consentLabels.test(label(radio))) || null;
    }
    if (settings.legitimateInterest && radios.some(radio => allowInterestLabels.test(label(radio)))) {
      return radios.find(radio => objectionLabels.test(label(radio))) || null;
    }
    return null;
  }

  function handleDidomi(panel) {
    if (settings.level !== 'max' || !settings.autoConfirm) return false;
    const preferences = panel.querySelector('.didomi-consent-popup__dialog[role="dialog"]');
    if (visible(preferences)) {
      if (!managedDidomi.has(panel)) return false;
      const groups = [...preferences.querySelectorAll(didomiChoices)].filter(visible);
      const targets = groups.map(didomiChoice);
      const allGroups = [...preferences.querySelectorAll('[role="radiogroup"]')].filter(visible);
      if (!targets.length || allGroups.length !== groups.length || targets.some(target => !enabled(target))) return false;
      const next = targets.find(target => target.getAttribute('aria-checked') === 'false');
      if (next) {
        if (attempts.has(next)) return false;
        attempts.add(next);
        next.click();
        schedule();
        return true;
      }
      if (!submit(preferences.querySelector('#btn-toggle-save'), 'Didomi')) return false;
      managedDidomi.delete(panel);
      return true;
    }

    const learnMore = panel.querySelector('#didomi-notice #didomi-notice-learn-more-button');
    if (!enabled(learnMore) || attempts.has(learnMore)) return false;
    attempts.add(learnMore);
    managedDidomi.add(panel);
    learnMore.click();
    schedule();
    return true;
  }

  function inspect(root) {
    for (const adapter of adapters) {
      for (const panel of root.querySelectorAll(adapter.root)) {
        if (!visible(panel)) continue;
        const controls = [...panel.querySelectorAll('button, [role="button"]')].filter(enabled);
        const direct = controls.find(button => button.matches(adapter.reject)) ||
          controls.find(button => rejectLabel.test(label(button)));
        if (direct && submit(direct, adapter.name)) return true;
        if (adapter.name === 'Didomi' && handleDidomi(panel)) return true;
      }
    }
    for (const element of root.querySelectorAll('*')) {
      if (element.shadowRoot && inspect(element.shadowRoot)) return true;
    }
    return false;
  }

  function schedule() {
    if (timer !== undefined) return;
    timer = setTimeout(() => {
      timer = undefined;
      const host = siteHost();
      if (host && !verificationPending && settings.autoConfirm && settings.level !== 'manual' &&
          !settings.disabledHosts.includes(host) && !settings.disabledHosts.includes(location.hostname)) inspect(document);
    }, 100);
  }

  chrome.storage.local.get('settings', ({settings: saved}) => {
    settings = {...defaults, ...saved};
    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ['aria-checked', 'aria-disabled', 'disabled', 'hidden', 'class']
    });
    schedule();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) {
      settings = {...defaults, ...changes.settings.newValue};
      schedule();
    }
  });
})();
