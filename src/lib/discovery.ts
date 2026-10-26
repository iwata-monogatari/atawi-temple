import { getRefurbFacts } from './refurb';
import { getDistrictName, getPhotoCategory, getTempleDisplaySummary, getVisibleTempleMediaPhotos, isCemeteryServiceInfo, type Temple } from './temples';

export function shortText(text: string, limit = 80) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  const sentence = clean.match(/^.{15,}?[。！？]/)?.[0];
  if (sentence && sentence.length <= limit) return sentence;
  return clean.length > limit ? clean.slice(0, limit - 1) + '…' : clean;
}
export function discoverySummary(temple: Temple) {
  const facts = getRefurbFacts(temple.slug);
  const section = facts?.history_sections.find(s => !/限界|確認順序/.test(s.heading) && !isCemeteryServiceInfo(s.body));
  return shortText(section?.body || getTempleDisplaySummary(temple), 90);
}
export function discoveryClues(temple: Temple) {
  const facts = getRefurbFacts(temple.slug);
  const clues: {title:string; body:string; href:string}[] = [];
  const history = facts?.history_sections.find(s => !/限界|確認順序/.test(s.heading) && !isCemeteryServiceInfo(s.body));
  if (history) clues.push({title:history.heading, body:shortText(history.body,160), href:'#history'});
  const asset = facts?.cultural_assets?.find(a => !isCemeteryServiceInfo(a.summary));
  if (asset) clues.push({title:asset.name, body:shortText(asset.summary,130), href:'#heritage'});
  if (!clues.length) clues.push({title:`${getDistrictName(temple.district_id)}で知る${temple.name}`, body:getTempleDisplaySummary(temple), href:'#about'});
  return clues.slice(0,3);
}
export function relatedReason(current: Temple, target: Temple, type: 'area' | 'sect' | 'nearby') {
  if (type === 'sect') return `${current.sect}のお寺を読み比べる。${getDistrictName(target.district_id)}の${target.name}には、どんな記録が残るでしょう。`;
  if (type === 'nearby') return `周辺にある${target.name}の写真や記録から、この地域の姿をもう少し見てみませんか。`;
  return `同じ${getDistrictName(current.district_id)}の${target.name}へ。${discoverySummary(target)}`;
}
export function photoDescription(photo: {alt:string; caption:string;category_id:string}, temple: Temple) {
  const caption = photo.caption && !/[�]/.test(photo.caption) ? photo.caption : '';
  const alt = photo.alt && !/[�]/.test(photo.alt) ? photo.alt : `${temple.name}の${getPhotoCategory(photo.category_id)?.label || '現地写真'}`;
  return {alt, caption:caption || `${alt}。建物や周囲の様子を写真でご覧ください。`};
}
export function orderedPhotos(temple: Temple) {
  const order = ['entrance-marker','main-building','grounds','stonework','signboard'];
  const sorted = getVisibleTempleMediaPhotos(temple.slug).map((p,i) => ({p,i})).sort((a,b) => {
    const score = (category:string) => {const n=order.indexOf(category); return n < 0 ? 10 : n;};
    return score(a.p.category_id)-score(b.p.category_id)||a.i-b.i;
  }).map(({p}) => ({...p,...photoDescription(p,temple)}));
  const categories = new Set<string>();
  const featured = sorted.filter(p => {if(categories.has(p.category_id)) return false;categories.add(p.category_id);return true;}).slice(0,6);
  const paths = new Set(featured.map(p => p.src));
  return [...featured,...sorted.filter(p => !paths.has(p.src))];
}
