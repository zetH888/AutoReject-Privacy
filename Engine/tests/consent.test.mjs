import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {runInNewContext} from 'node:vm';

const contentScript = readFileSync(new URL('../content/index.js', import.meta.url), 'utf8');

function runFixture({
  level = 'max', unknown = false, adapter = 'Didomi', cookie = '',
  disabledHosts = [], topOrigin
} = {}) {
  const clicks = [];
  const history = [];
  const timers = [];
  function button(text) {
    return {
      innerText: text, checked: false,
      getClientRects: () => [1], matches: () => false,
      getAttribute(name) { return name === 'aria-checked' ? String(this.checked) : null; },
      click() { this.checked = true; clicks.push(text); }
    };
  }
  const group = (deny, allow) => ({...button(''), querySelectorAll: () => [deny, allow]});
  const groups = [
    group(button('Nie akceptuję'), button('Akceptuję')),
    group(button(unknown ? 'Nieznany wybór' : 'Nie akceptuję'), button('Akceptuję'))
  ];
  const save = button('Zapisz');
  let preferencesOpen = false;
  const preferences = {
    getClientRects: () => preferencesOpen ? [1] : [],
    querySelectorAll: () => groups,
    querySelector: () => save
  };
  const learnMore = button('Dowiedz się więcej');
  const open = learnMore.click.bind(learnMore);
  learnMore.click = () => { open(); preferencesOpen = true; };
  const decline = button('Deny');
  decline.matches = selector => selector === '#CybotCookiebotDialogBodyButtonDecline';
  const panel = {
    getClientRects: () => [1],
    querySelectorAll: () => adapter === 'Cookiebot' ? [decline] : [],
    querySelector: selector => selector.startsWith('.didomi') ? preferences : learnMore
  };
  const document = {
    cookie,
    documentElement: {},
    querySelectorAll: selector => selector === (adapter === 'Cookiebot' ? '#CybotCookiebotDialog' : '#didomi-host') ? [panel] : []
  };
  runInNewContext(contentScript, {
    window: topOrigin ? {top: {}} : {}, document,
    location: {hostname: 'fixture.test', ancestorOrigins: topOrigin ? [topOrigin] : []}, URL,
    getComputedStyle: () => ({visibility: 'visible'}),
    setTimeout: fn => timers.push(fn),
    MutationObserver: class { observe() {} },
    chrome: {
      storage: {local: {get: (_, callback) => callback({settings: {level, disabledHosts}})}, onChanged: {addListener() {}}},
      runtime: {sendMessage: async message => { history.push(message.status); }}
    }
  });
  for (let ticks = 0; timers.length && ticks < 20; ticks++) timers.shift()();
  assert.equal(timers.length, 0);
  return {clicks, history};
}

test('Didomi opens preferences, refuses each purpose and submits once', () => {
  assert.deepEqual(runFixture(), {
    clicks: ['Dowiedz się więcej', 'Nie akceptuję', 'Nie akceptuję', 'Zapisz'],
    history: ['submitted-unverified']
  });
});

test('Didomi stops before editing an unrecognized group', () => {
  assert.deepEqual(runFixture({unknown: true}), {clicks: ['Dowiedz się więcej'], history: []});
});

test('manual mode leaves Didomi untouched', () => {
  assert.deepEqual(runFixture({level: 'manual'}), {clicks: [], history: []});
});

test('pausing a site also applies inside its cross-origin consent frame', () => {
  const topOrigin = 'https://paused.test';
  assert.deepEqual(runFixture({topOrigin, disabledHosts: ['paused.test']}), {clicks: [], history: []});
  assert.deepEqual(runFixture({topOrigin: 'null'}), {clicks: [], history: []});
  assert.ok(runFixture({topOrigin}).clicks.includes('Zapisz'));
});

test('Cookiebot records verified rejection only with all optional flags off', () => {
  for (const [flags, status] of [
    ['{preferences:false,statistics:false,marketing:false}', 'rejected'],
    ['{preferences:false,statistics:false,marketing:true}', 'submitted-unverified'],
    ['', 'submitted-unverified']
  ]) {
    assert.deepEqual(runFixture({adapter: 'Cookiebot', cookie: 'CookieConsent=' + encodeURIComponent(flags)}), {
      clicks: ['Deny'], history: [status]
    });
  }
});
