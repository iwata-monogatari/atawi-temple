const FOOTER_PATH = "/partials/footer.html";
const LEGACY_PATHS = new Map([
  ["/contact", "/correction/"],
  ["/company/contact", "/correction/"],
  ["/お問い合わせ", "/correction/"],
  ["/お問合せ", "/correction/"],
  ["/temples/fukuoji-shinmeicho", "/temples/fukuoji-jonosaki/"],
  ["/topics/haka/hakajimai-cost", "/topics/ohaka/ohaka-14/"],
  ["/topics/haka/kaisou-kyoka-flow", "/topics/ohaka/ohaka-16/"],
  ["/topics/dan/ridan-jitsumu", "/guide/danka/"],
]);

export async function onRequest(context) {
  const url = new URL(context.request.url);
  let pathname = url.pathname;
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    // Malformed URL escapes are left to the existing routing behavior.
  }
  const destination = LEGACY_PATHS.get(pathname.replace(/\/$/, ""));
  if (["GET", "HEAD"].includes(context.request.method) && destination) {
    url.pathname = destination;
    return Response.redirect(url.href, 301);
  }
  if (url.pathname.startsWith("/partials/")) {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  const footerResponse = await context.env.ASSETS.fetch(
    new Request(new URL(FOOTER_PATH, context.request.url), { method: "GET" }),
  );
  if (!footerResponse.ok) {
    return response;
  }

  const footerHtml = await footerResponse.text();
  return new HTMLRewriter()
    .on("footer", {
      element(element) {
        element.remove();
      },
    })
    .on("body", {
      element(element) {
        element.append(
          `<footer class="fgo-global-footer-shell">${footerHtml}</footer>`,
          { html: true },
        );
      },
    })
    .transform(response);
}
