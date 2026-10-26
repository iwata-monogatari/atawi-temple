import {readFile,access} from 'node:fs/promises';
import assert from 'node:assert/strict';
const temples=JSON.parse(await readFile('data/temples.json','utf8'));
assert.equal(temples.length,118,'Registered temple count must remain 118');
const home=await readFile('dist/index.html','utf8');
assert.match(home,/data-pickup-count="6"/);
assert.equal((home.match(/data-hero-slide(?:=|\s|>)/g)||[]).length,7);
for(const path of ['ranking','readings','readings/temple-and-nearby-shrine','readings/gate-and-torii','readings/kami-and-buddha-history']) await access(`dist/${path}/index.html`);
for(const temple of temples) {
 const html=await readFile(`dist/temples/${temple.slug}/index.html`,'utf8');
 assert.match(html,/id="temple-basic"/);
 const ids=new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]));
 for(const hash of [...html.matchAll(/href="#(about|history|heritage|photos|sources|temple-basic)"/g)].map(m=>m[1])) assert.ok(ids.has(hash),`${temple.slug}: missing #${hash}`);
}
console.log('[OK] discovery: 118 temples, 6 pickup slots, 7 hero slides, readings/ranking and detail anchors');
