import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {runInNewContext} from 'node:vm';

const background = readFileSync(new URL('../background/index.js', import.meta.url), 'utf8');
const popupUrl = 'chrome-extension://test/ui/popup.html';
const site = {url: 'https://cmp.example/dialog', tab: {url: 'https://site.example/page'}};
const result = {type: 'CONSENT_RESULT', status: 'rejected', adapter: 'Cookiebot'};

function storageFixture(settings, seededHistory) {
  let handler;
  const data = {settings, history: seededHistory};
  runInNewContext(background, {
    URL,
    chrome: {
      runtime: {
        getURL: path => 'chrome-extension://test/' + path,
        onMessage: {addListener: callback => { handler = callback; }}
      },
      storage: {local: {
        get: async () => ({...data}),
        set: async values => Object.assign(data, values),
        remove: async key => { delete data[key]; }
      }}
    }
  });
  function send(message, sender) {
    return new Promise(resolve => {
      if (!handler(message, sender, resolve)) resolve(undefined);
    });
  }
  return {data, send};
}

test('new installations do not retain browsing history until opted in', async () => {
  const {data, send} = storageFixture(undefined);
  assert.equal((await send(result, site)).ok, true);
  assert.equal(data.history, undefined);
});

test('history survives concurrent results and clears only from the extension popup', async () => {
  const {data, send} = storageFixture({localHistory: true}, []);
  await Promise.all([send(result, site), send({...result, status: 'submitted-unverified'}, site)]);
  assert.equal(data.history.length, 2);
  assert.equal(data.history[0].host, 'site.example');
  assert.equal(data.history[0].status, 'submitted-unverified');
  assert.equal(await send({type: 'CLEAR_HISTORY'}, site), undefined);
  assert.equal(data.history.length, 2);
  await send({type: 'CLEAR_HISTORY'}, {url: popupUrl});
  assert.equal(data.history, undefined);
});
