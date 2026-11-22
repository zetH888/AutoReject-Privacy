import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
test('manifest is MV3 with local storage only',()=>{
const m=JSON.parse(readFileSync(new URL('manifest.json',root)));
assert.equal(m.manifest_version,3);assert.deepEqual(m.permissions,['storage']);assert.equal(m.content_scripts[0].all_frames,true);
});
test('critical files present',()=>{
for(const p of ['content/index.js','background/index.js','ui/popup.html','ui/popup.js']) assert.ok(existsSync(new URL(p,root)),p)
});
test('reject rules do not include accept-all',()=>{
const js=readFileSync(new URL('content/index.js',root),'utf8');assert.match(js,/odrzuć wszystkie/);assert.doesNotMatch(js,/clickOnce\([^\n]*accept all/i)
});
