import { readFile } from "node:fs/promises";

const errors = [];

async function readBuiltFile(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    errors.push(`build output: missing ${path}`);
    return "";
  }
}

const toyodaHtml = await readBuiltFile("dist/areas/toyoda/index.html");
const chionsaiHtml = await readBuiltFile("dist/temples/chionsai-hitokoto/index.html");
const expectedToyodaHeroImage = "/images/temples/gyokoji-ikeda/gyokoji-ikeda-03-main-hall.webp";
const expectedChionsaiHeroImage = "/assets/temples/chionsai-hitokoto/748700946_37058201220492041_8019282847618984703_n.jpg";
const requiredToyodaTempleNames = [
  "行興寺",
  "松向寺",
  "智恩齋",
  "安楽寺",
  "豊田院",
  "正医寺",
  "福王寺",
  "林昌寺",
  "興徳寺",
  "養福寺",
  "妙法寺",
  "誓渡院",
  "大圓寺",
  "大蔵寺",
];

if (toyodaHtml) {
  if (!toyodaHtml.includes(expectedToyodaHeroImage)) {
    errors.push(`areas/toyoda: expected fixed hero image ${expectedToyodaHeroImage}`);
  }

  for (const name of requiredToyodaTempleNames) {
    if (!toyodaHtml.includes(name)) {
      errors.push(`areas/toyoda: missing required temple name "${name}"`);
    }
  }

  if (toyodaHtml.includes("temple-card-photo--placeholder")) {
    errors.push("areas/toyoda: no-photo cards must render as text cards, not empty photo placeholders");
  }

  if (!toyodaHtml.includes("temple-card--no-photo")) {
    errors.push("areas/toyoda: expected no-photo cards to use temple-card--no-photo");
  }
}

if (chionsaiHtml) {
  if (!chionsaiHtml.includes(expectedChionsaiHeroImage)) {
    errors.push(`temples/chionsai-hitokoto: expected restored hero image ${expectedChionsaiHeroImage}`);
  }

  if (!chionsaiHtml.includes("智恩齋")) {
    errors.push("temples/chionsai-hitokoto: missing temple name");
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`[NG] ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("[OK] build output validated");
}
