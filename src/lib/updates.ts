import blogData from '../../data/blog-posts.json';
import {allTempleUpdates, getTempleBySlug, isCemeteryServiceInfo} from './temples';
import {buildUpdateFeed} from './update-feed.mjs';

export const HOME_UPDATE_LIMIT = 5;
export const allSiteUpdates = buildUpdateFeed(
  allTempleUpdates.map(update => ({
    ...update,
    summary:isCemeteryServiceInfo(update.summary) ? '現地写真と基礎情報を更新しました。' : update.summary,
  })),
  blogData.posts,
).map(update => {
  const temple = getTempleBySlug(update.temple_slug);
  return {...update, temple_name:temple?.name || '', temple_area:temple?.area || ''};
});
export const recentSiteUpdates = allSiteUpdates.slice(0, HOME_UPDATE_LIMIT);
export const siteUpdatesLabel = '寺院・研究・ブログの公開・更新';
