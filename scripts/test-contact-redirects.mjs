import assert from "node:assert/strict";
import { onRequest } from "../functions/_middleware.js";

let redirected = 0;
for (const pathname of ["/contact", "/company/contact", "/お問い合わせ", "/お問合せ"]) {
  for (const suffix of ["", "/"]) {
    for (const query of ["", "?fga_internal=1", "?from=footer&fga_internal=1"]) {
      for (const method of ["GET", "HEAD"]) {
        const request = new Request(`https://temple.atawi.link${pathname}${suffix}${query}`, { method });
        const response = await onRequest({
          request,
          next() { throw new Error("A contact alias must redirect before loading the 404 or footer"); },
        });
        assert.equal(response.status, 301, request.url);
        assert.equal(response.headers.get("location"), `https://temple.atawi.link/correction/${query}`);
        redirected++;
      }
    }
  }
}

for (const pathname of [
  "/", "/correction/", "/contact-extra/", "/company/contact/other/",
  "/blog/contact/", "/api/board-posts", "/admin/board/", "/partials/footer.html", "/%E0%A4%A",
]) {
  const original = new Response("unchanged", { headers: { "content-type": "application/json" } });
  let nextCalls = 0;
  const response = await onRequest({
    request: new Request(`https://temple.atawi.link${pathname}`),
    next() { nextCalls++; return original; },
  });
  assert.equal(response, original, pathname);
  assert.equal(nextCalls, 1, pathname);
}

for (const method of ["POST", "PUT", "DELETE", "OPTIONS"]) {
  const original = new Response("unchanged", { status: 405 });
  const response = await onRequest({
    request: new Request("https://temple.atawi.link/contact", { method }),
    next: () => original,
  });
  assert.equal(response, original, method);
}

console.log(`Contact redirects validated: ${redirected} GET/HEAD cases, 9 unrelated paths, 4 non-navigation methods.`);
