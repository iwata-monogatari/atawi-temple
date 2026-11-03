/**
 * One current notice per blog article. Updating its metadata moves it to the
 * effective update date; publication dates and original temple notices stay intact.
 * @param {{update_id:string,date:string,title:string,summary:string,temple_slug:string,href?:string,kind?:string}[]} templeUpdates
 * @param {{slug:string,title:string,description:string,published:string,updated?:string}[]} posts
 */
export function buildUpdateFeed(templeUpdates, posts) {
  const blogUpdates = posts.map(post => {
    const revised = Boolean(post.updated && post.updated > post.published);
    return {
      update_id: `blog-${post.slug}`,
      kind: 'blog',
      date: revised ? post.updated : post.published,
      temple_slug: '',
      title: `ブログ「${post.title}」を${revised ? '更新' : '公開'}しました`,
      summary: post.description,
      href: `/blog/${post.slug}/`,
    };
  });
  return [...templeUpdates, ...blogUpdates]
    .map(update => ({...update, date:update.date || '', href:update.href || `/temples/${update.temple_slug}/`}))
    .sort((a,b) => b.date.localeCompare(a.date));
}
