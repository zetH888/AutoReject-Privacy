const defaults = {
  level: 'max', autoConfirm: true, legitimateInterest: true,
  localHistory: false, disabledHosts: []
};
const get = id => document.getElementById(id);
const controls = ['level', 'autoConfirm', 'legitimateInterest', 'localHistory'];
const statusLabels = {
  rejected: 'Odrzucono',
  'submitted-unverified': 'Wysłano wybór, zapis niepotwierdzony',
  'saved-optional-off': 'Zapisano wybór, zapis niepotwierdzony',
  'preferences-opened': 'Otwarto preferencje',
  'switched-optional-off-needs-confirmation': 'Wybór wymaga zatwierdzenia'
};

let settings;
let host;
let history;
let pending = Promise.resolve();

function updateSettings(update) {
  pending = pending.then(async () => {
    const stored = await chrome.storage.local.get('settings');
    const current = {...defaults, ...stored.settings};
    settings = {...current, ...update(current)};
    await chrome.storage.local.set({settings});
    render();
    get('status').textContent = 'Zapisano ustawienia.';
  }).catch(() => { get('status').textContent = 'Nie udało się zapisać ustawień.'; });
}

function render() {
  for (const id of controls) {
    const control = get(id);
    if (control.type === 'checkbox') control.checked = settings[id];
    else control.value = settings[id];
  }

  const paused = host && settings.disabledHosts.includes(host);
  get('site').textContent = host || 'Brak aktywnej witryny HTTP(S)';
  get('pause').disabled = !host;
  get('pause').textContent = paused ? 'Wznów na tej witrynie' : 'Wstrzymaj na tej witrynie';
  const last = settings.localHistory && history.find(entry => entry.host === host);
  let siteStatus = 'Automatyzacja aktywna';
  if (!host) siteStatus = 'Otwórz stronę internetową, aby zarządzać automatyzacją.';
  else if (paused) siteStatus = 'Automatyzacja wstrzymana dla tej domeny.';
  else if (!settings.autoConfirm || settings.level === 'manual') siteStatus = 'Oczekuje na decyzję użytkownika.';
  get('site-status').textContent = last
    ? `${siteStatus} · Ostatnie działanie: ${statusLabels[last.status] || last.status}`
    : siteStatus;

  const list = get('history');
  list.replaceChildren();
  get('clear').disabled = history.length === 0;
  if (!settings.localHistory || !history.length) {
    const empty = document.createElement('li');
    empty.textContent = settings.localHistory ? 'Brak zapisanych działań' : 'Zapisywanie historii wyłączone';
    list.append(empty);
    return;
  }
  for (const entry of history.slice(0, 15)) {
    const item = document.createElement('li');
    item.textContent = `${entry.host} · ${statusLabels[entry.status] || entry.status} (${entry.adapter})`;
    list.append(item);
  }
}

async function init() {
  const [stored, [tab]] = await Promise.all([
    chrome.storage.local.get(['settings', 'history']),
    chrome.tabs.query({active: true, currentWindow: true})
  ]);
  if (/^https?:\/\//.test(tab?.url || '')) host = new URL(tab.url).hostname;
  settings = {...defaults, ...stored.settings};
  history = stored.history || [];
  for (const id of controls) {
    get(id).disabled = false;
    get(id).addEventListener('change', event => {
      const control = event.currentTarget;
      const value = control.type === 'checkbox' ? control.checked : control.value;
      updateSettings(() => ({[id]: value}));
    });
  }
  get('pause').addEventListener('click', () => {
    updateSettings(current => ({
      disabledHosts: current.disabledHosts.includes(host)
        ? current.disabledHosts.filter(domain => domain !== host)
        : [...current.disabledHosts, host]
    }));
  });
  get('clear').addEventListener('click', async () => {
    try {
      const result = await chrome.runtime.sendMessage({type: 'CLEAR_HISTORY'});
      if (!result?.ok) throw new Error('Could not clear history');
      get('status').textContent = 'Wyczyszczono historię.';
    } catch {
      get('status').textContent = 'Nie udało się wyczyścić historii.';
    }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.history) history = changes.history.newValue || [];
    if (changes.settings) settings = {...defaults, ...changes.settings.newValue};
    render();
  });
  render();
}

init().catch(() => { get('status').textContent = 'Nie udało się wczytać ustawień.'; });
