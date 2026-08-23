const FOOTER_PATH = "/partials/footer.html";

export async function onRequest(context) {
  const url = new URL(context.request.url);
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
