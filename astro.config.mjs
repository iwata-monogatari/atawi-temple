import { defineConfig } from "astro/config";
import { repairBuiltReferenceLinks } from "./scripts/repair-reference-links.mjs";

export default defineConfig({
  site: "https://temple.atawi.link",
  integrations: [{
    name: "reviewed-reference-links",
    hooks: { "astro:build:done": ({ dir }) => repairBuiltReferenceLinks(dir) },
  }],
});
