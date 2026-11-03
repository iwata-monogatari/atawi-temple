import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildUpdateFeed} from '../src/lib/update-feed.mjs';

const original = [{update_id:'temple-1',date:'2026-07-25',temple_slug:'sample',title:'寺院更新',summary:'既存の記録'}];
const post = {slug:'sample-post',title:'記事',description:'記事の説明',published:'2026-07-20',updated:'2026-10-26'};
const feed=buildUpdateFeed(original,[post]);
assert.equal(feed[0].date,'2026-10-26');
assert.equal(feed[0].title,'ブログ「記事」を更新しました');
assert.equal(feed[0].href,'/blog/sample-post/');
assert.equal(feed[0].summary,post.description);
assert.equal(feed[1].href,'/temples/sample/');
assert.equal(original[0].href,undefined,'Do not mutate existing records');
assert.equal(buildUpdateFeed([], [{...post,updated:post.published}])[0].title,'ブログ「記事」を公開しました');
assert.equal(buildUpdateFeed([], [{...post,updated:undefined}])[0].date,post.published);
assert.equal(buildUpdateFeed([], [{...post,updated:'2026-07-01'}])[0].date,post.published);
assert.equal(buildUpdateFeed(original,[]).length,1);

const posts=JSON.parse(await readFile('data/blog-posts.json','utf8')).posts;
const temples=JSON.parse(await readFile('data/temple-updates.json','utf8'));
const actual=buildUpdateFeed(temples,posts);
assert.equal(actual.length,temples.length+posts.length);
assert.equal(new Set(actual.map(u=>u.update_id)).size,actual.length);
assert.ok(actual.every((u,i)=>i===0 || actual[i-1].date>=u.date));
for(const p of posts){
  const notices=actual.filter(u=>u.update_id===`blog-${p.slug}`);
  assert.equal(notices.length,1);
  assert.equal(notices[0].date,[p.published,p.updated].filter(Boolean).sort().at(-1));
}
console.log(`[OK] merged ${temples.length} existing notices + ${posts.length} blogs; publication/update dates, ordering and one notice per blog`);

// All three public outputs must consume the same feed, including without JS.
const latest=JSON.parse(await readFile('dist/updates/latest.json','utf8')).updates;
const home=await readFile('dist/index.html','utf8');
const archive=await readFile('dist/updates/index.html','utf8');
const notices=html=>[...html.matchAll(/<article class="update-item"[^>]*>([\s\S]*?)<\/article>/g)].map(m=>({
  date:m[1].match(/datetime="([^"]+)"/)?.[1],
  href:m[1].match(/<h3[^>]*>\s*<a[^>]*href="([^"]+)"/)?.[1],
}));
assert.deepEqual(latest.map(u=>({date:u.date,href:u.href})),actual.slice(0,5).map(u=>({date:u.date,href:u.href})));
assert.deepEqual(notices(home),latest.map(u=>({date:u.date,href:u.href})));
assert.deepEqual(notices(archive),actual.slice(5).map(u=>({date:u.date,href:u.href})));
assert.match(home,/寺院・研究・ブログの公開・更新/);
for(const update of latest) await readFile(`dist${update.href}index.html`);
console.log(`[OK] home and JSON share 5 notices; archive contains the remaining ${actual.length-5} notices; blog destinations exist`);
