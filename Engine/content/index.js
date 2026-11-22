(() => {
  'use strict';
  const DEFAULTS = {level:'max', autoConfirm:true, legitimateInterest:true, notifications:false, localHistory:true, disabledHosts:[]};
  if (window.__autoRejectPrivacyLoaded) return;
  window.__autoRejectPrivacyLoaded = true;
  let settings = DEFAULTS;
  let scanning = false;
  let scheduled = false;
  const attempted = new WeakSet();
  const words = {
    reject: [/^reject all$/i, /^reject optional$/i, /^decline all$/i, /^deny all$/i, /^refuse all$/i,
      /^odrzuć wszystkie$/i, /^odrzuć opcjonalne$/i, /^odmów wszystkim$/i, /^odmów zgody$/i,
      /^alle ablehnen$/i, /^tout refuser$/i, /^rechazar (todo|todas)$/i],
    prefs: [/^manage (options|preferences|settings)$/i, /^customi[sz]e$/i, /^preferences$/i,
      /^ustawienia (prywatności|cookies|zgód)$/i, /^zarządzaj (zgodami|preferencjami)$/i,
      /^dostosuj (zgody|ustawienia)$/i],
    save: [/^confirm (my )?(choices|selections)$/i, /^save (my )?(choices|preferences|settings)$/i,
      /^allow selection$/i, /^potwierdź wybrane opcje$/i, /^zapisz (preferencje|wybór|ustawienia)$/i,
      /^speichern$/i, /^enregistrer (mes )?choix$/i]
  };
  function text(el) {return (el.innerText || el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g,' ').trim().slice(0,120)}
  function match(el, patterns) {return patterns.some(rx=>rx.test(text(el)))}
  function visible(el) {return !!el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'}
  function buttons(root) {return [...root.querySelectorAll('button, [role="button"], input[type="button"]')].filter(visible)}
  function report(status, adapter) {try{chrome.runtime.sendMessage({type:'CONSENT_RESULT', status, adapter})}catch{}}
  function clickOnce(el, status, adapter) {
    if (attempted.has(el)) return false;
    attempted.add(el);el.click();report(status,adapter);return true;
  }
  function inspect(root) {
    // Strict allowlist of recognized CMP roots. Generic pages are deliberately not clicked.
    const specs = [
      {name:'OneTrust', selector:'#onetrust-banner-sdk, #onetrust-pc-sdk', deny:'#onetrust-reject-all-handler, .ot-pc-refuse-all-handler', prefs:'#onetrust-pc-btn-handler'},
      {name:'Cookiebot', selector:'#CybotCookiebotDialog', deny:'#CybotCookiebotDialogBodyButtonDecline'},
      {name:'Didomi', selector:'#didomi-host', deny:'#didomi-notice-disagree-button, .didomi-components-button--disagree'},
      {name:'Usercentrics', selector:'#usercentrics-root, [data-testid="uc-container"]', deny:'[data-testid="uc-deny-all-button"]'}
    ];
    for (const spec of specs) {
      for (const panel of root.querySelectorAll(spec.selector)) {
        if (!visible(panel)) continue;
        const denied = panel.querySelector(spec.deny);
        if (denied && visible(denied) && clickOnce(denied,'rejected',spec.name)) return true;
        const bs=buttons(panel);
        const reject=bs.find(x=>match(x,words.reject));
        if (reject && clickOnce(reject,'rejected',spec.name)) return true;
        const pref=spec.prefs && panel.querySelector(spec.prefs);
        if (pref && visible(pref) && clickOnce(pref,'preferences-opened',spec.name)) return true;
        // A save button is only safe after explicit off-switch processing.
        if (settings.level==='max') {
          let changes=0;
          for(const input of panel.querySelectorAll('input[type="checkbox"]')) {
            if (!input.checked || input.disabled || input.required || !visible(input)) continue;
            const scope=input.closest('label, [role="group"], li') || input.parentElement;
            const label=text(scope).toLowerCase();
            if (/(necessary|essential|required|niezbędn|wymagan|konieczn)/i.test(label)) continue;
            input.click(); if (!input.checked) changes++;
          }
          if (changes && settings.autoConfirm) {
            const save=bs.find(x=>match(x,words.save));
            if(save && clickOnce(save,'saved-optional-off',spec.name)) return true;
          }
          if(changes) { report('switched-optional-off-needs-confirmation',spec.name);return true; }
        }
      }
    }
    return false;
  }
  function roots() {
    const result=[document];
    const walk=(root)=>{for(const el of root.querySelectorAll('*'))if(el.shadowRoot){result.push(el.shadowRoot);walk(el.shadowRoot)}};
    walk(document);return result;
  }
  function schedule() {
    if (scheduled) return;
    scheduled=true;
    setTimeout(()=>{scheduled=false; if(scanning)return;scanning=true;
      try {if(settings.level!=='manual' && !settings.disabledHosts.includes(location.hostname)){
        for(const root of roots()) if(inspect(root)) break;
      }} finally {scanning=false}
    },250);
  }
  chrome.storage.local.get('settings', ({settings: saved})=>{
    settings={...DEFAULTS,...saved};schedule();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:false});
  });
  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area==='local' && changes.settings){settings={...DEFAULTS,...changes.settings.newValue};schedule()}
  });
})();
