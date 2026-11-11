// Builds catalogue plates and seeds reviews + richer product fields.
const fs = require("fs");
const path = require("path");

const catalogPath = path.join(__dirname, "..", "catalog.json");
const reviewPath = path.join(__dirname, "..", "data", "reviews.json");
const assetDir = path.join(__dirname, "..", "..", "..", "jtc-frontend", "jtc-frontend", "assets", "products");

const extra = {
  0: { stock: 14, rating: 4.9, season: "All season", colors: [["Navy", "#1f2a4a"], ["Black", "#161616"], ["Forest", "#1d3328"]], details: ["Bone buttons", "Clean chest panel", "Side slit"], care: "Dry clean. Steam the sleeve, do not wring." },
  1: { stock: 9, rating: 4.8, season: "Wedding", colors: [["Cream", "#cbbf9f"], ["Ivory", "#efe6d4"]], details: ["Tonal stitching", "Soft drape", "Couple-ready"], care: "Dry clean only." },
  2: { stock: 6, rating: 4.9, season: "Ceremony", colors: [["Cocoa", "#5b3a29"], ["Gold brown", "#8a6239"]], details: ["Three pieces", "Matching fila", "Wide sleeve"], care: "Dry clean. Hang on a wide shoulder." },
  3: { stock: 3, rating: 5, season: "Limited", colors: [["Espresso", "#3a2a1c"], ["Black gold", "#1a140f"]], details: ["Hand embroidery", "Made to measure only", "Neck, chest and sleeve"], care: "Specialist clean. Keep the embroidery flat." },
  4: { stock: 16, rating: 4.6, season: "Travel", colors: [["Olive", "#2d3b2d"], ["Sand", "#c2b49a"], ["Ink", "#1c2430"]], details: ["Deep placket", "Matching cap", "Easy travel"], care: "Cool wash or dry clean." },
  5: { stock: 11, rating: 4.7, season: "Aso-ebi", colors: [["Rust", "#a8431f"], ["Indigo", "#1e3a5f"], ["Emerald", "#1f6b45"]], details: ["Bring your cloth or use studio stock", "Shirt and trouser", "Group cutting"], care: "Cool wash inside out." },
  6: { stock: 8, rating: 4.8, season: "Office", colors: [["Charcoal", "#222222"], ["Navy", "#1c2430"], ["Mid grey", "#6e7278"]], details: ["Two-button jacket", "Light shoulder", "Flat-front trouser"], care: "Dry clean. Brush between wears." },
  7: { stock: 22, rating: 4.5, season: "Wardrobe", colors: [["Sky", "#7d8fa8"], ["White", "#f4f1ea"], ["Pale blue", "#d5e2ea"]], details: ["Spread collar", "Slim body", "Precise sleeve"], care: "Machine wash cold. Hang dry." },
  8: { stock: 18, rating: 4.4, season: "Weekend", colors: [["Harbour", "#35566e"], ["Stone", "#b7a48a"], ["Black", "#1a1612"]], details: ["Pique cotton", "Tailored waist", "Soft collar"], care: "Cool wash. Reshape while damp." },
  9: { stock: 20, rating: 4.6, season: "Finish", colors: [["Tan", "#6a4a2b"], ["Black", "#1a1612"], ["Wine", "#6e2f3a"]], details: ["Fila or English cap", "Cut from the outfit cloth"], care: "Spot clean. Stuff with tissue." },
  10: { stock: 15, rating: 4.5, season: "Finish", colors: [["Espresso", "#2a1f16"], ["Black", "#111111"], ["Cognac", "#8a4b2a"]], details: ["Full-grain leather", "Brushed buckle", "Punched to your waist"], care: "Condition the leather twice a year." },
  11: { stock: 24, rating: 4.3, season: "Finish", colors: [["Wine", "#8a2d3a"], ["Ivory", "#f3eee6"], ["Navy", "#1f2a4a"]], details: ["Set of three", "Silk blend", "Sits clean on navy"], care: "Steam. Do not wash." },
  12: { stock: 2, rating: 5, season: "Groom", colors: [["Ivory", "#e6dcc8"], ["Gold ivory", "#f0e2c4"]], details: ["Gold thread", "Matching fila", "Book the fitting first"], care: "Specialist clean. Store in a breathable bag." },
  13: { stock: 10, rating: 4.7, season: "Group", colors: [["Wine", "#6e2f3a"], ["Royal", "#1f2a4a"], ["Emerald", "#1d4a38"]], details: ["One pattern, many bodies", "Batch cut", "Still individually fitted"], care: "Dry clean." },
  14: { stock: 5, rating: 4.8, season: "Evening", colors: [["Navy", "#1c2430"], ["Black", "#141414"]], details: ["Peak lapel", "Six-button double breast", "Clean break"], care: "Dry clean. Use a wide hanger." },
  15: { stock: 12, rating: 4.6, season: "Harmattan", colors: [["Stone", "#b7a48a"], ["Chalk", "#e7e0d4"], ["Olive", "#6d7052"]], details: ["Hidden placket", "Side vent", "Breathable linen"], care: "Cool wash. Expect a soft crease." },
  16: { stock: 9, rating: 4.7, season: "Indigo", colors: [["Indigo", "#1e3a5f"], ["Deep indigo", "#14243d"]], details: ["Camp collar", "Adire cotton", "Open or buttoned"], care: "Wash cold separately the first time." },
  17: { stock: 13, rating: 4.5, season: "Finish", colors: [["Wine", "#4a1c2a"], ["Black", "#1a120f"], ["Forest", "#1d3328"]], details: ["Structured crown", "Cotton velvet", "Pairs with agbada"], care: "Steam from the inside. Do not crush." },
};

const quotes = [
  ["The shoulder sat where we marked it.", "Tunde", "Bodija"],
  ["Quiet cloth, sharp finish. I wore it the next Friday.", "Ibrahim", "Secretariat"],
  ["The group still looked like one party, and I still looked like myself.", "Segun", "Ring Road"],
  ["Cloth arrived pressed, with the fila cut from the same piece.", "Adewale", "Akobo"],
  ["They corrected the sleeve within the week. No argument.", "Kunle", "Mokola"],
  ["The embroidery is the thing people ask about.", "Femi", "Lekki, visiting"],
];

function pattern(cat, hex) {
  if (cat === "Ankara") {
    return `<pattern id="pat" width="28" height="28" patternUnits="userSpaceOnUse">
      <rect width="28" height="28" fill="${hex}"/>
      <path d="M0 28 L14 0 L28 28" fill="none" stroke="#f6f1e8" stroke-width="1.2" opacity=".45"/>
      <circle cx="14" cy="16" r="2" fill="#c6a15b"/>
    </pattern>`;
  }
  if (cat === "Corporate") {
    return `<pattern id="pat" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="${hex}"/>
      <path d="M0 8 H8" stroke="#000" stroke-width=".4" opacity=".25"/>
    </pattern>`;
  }
  if (cat === "Agbada") {
    return `<pattern id="pat" width="36" height="36" patternUnits="userSpaceOnUse">
      <rect width="36" height="36" fill="${hex}"/>
      <path d="M0 18 H36 M18 0 V36" stroke="#c6a15b" stroke-width=".6" opacity=".35"/>
    </pattern>`;
  }
  return `<pattern id="pat" width="14" height="14" patternUnits="userSpaceOnUse">
    <rect width="14" height="14" fill="${hex}"/>
    <path d="M0 14 L14 0" stroke="#fff" stroke-width=".5" opacity=".18"/>
  </pattern>`;
}

function silhouette(cat) {
  const robes = {
    Agbada: `<path d="M250 210 h300 l70 620 H180 Z" fill="url(#pat)" stroke="#f6f1e8" stroke-width="3"/>
      <path d="M360 230 v180 h80 V230" fill="none" stroke="#c6a15b" stroke-width="2"/>
      <path d="M300 430 H500 M280 470 H520 M320 510 H480" stroke="#c6a15b" stroke-width="1.4" opacity=".8"/>
      <circle cx="400" cy="150" r="46" fill="#e6d3bf"/>`,
    Senator: `<path d="M300 200 h200 l30 640 H270 Z" fill="url(#pat)" stroke="#f6f1e8" stroke-width="3"/>
      <path d="M360 250 h80 v70 h-80z" fill="none" stroke="#f6f1e8" stroke-width="2"/>
      <path d="M400 320 V760" stroke="#f6f1e8" stroke-width="1.4" opacity=".7"/>
      <circle cx="400" cy="150" r="46" fill="#e6d3bf"/>`,
    Kaftan: `<path d="M280 190 h240 l24 680 H256 Z" fill="url(#pat)" stroke="#f6f1e8" stroke-width="3"/>
      <path d="M400 250 V820" stroke="#c6a15b" stroke-width="2"/>
      <circle cx="400" cy="145" r="44" fill="#e6d3bf"/>`,
    Ankara: `<path d="M310 210 h180 l36 250 H274 Z" fill="url(#pat)" stroke="#f6f1e8" stroke-width="3"/>
      <path d="M330 500 h140 l20 340 H310 Z" fill="url(#pat)" stroke="#f6f1e8" stroke-width="3"/>
      <circle cx="400" cy="155" r="44" fill="#e6d3bf"/>`,
    Corporate: `<path d="M275 230 L400 180 L525 230 L490 620 H310 Z" fill="url(#pat)" stroke="#f6f1e8" stroke-width="3"/>
      <path d="M400 200 L360 340 H440 Z" fill="#f4efe6" opacity=".9"/>
      <path d="M348 620 h40 l12 230 h-64z M412 620 h40 l12 230 h-64z" fill="url(#pat)" stroke="#f6f1e8" stroke-width="2"/>
      <circle cx="400" cy="140" r="42" fill="#e6d3bf"/>`,
    Casual: `<path d="M315 230 h170 l20 360 H295 Z" fill="url(#pat)" stroke="#f6f1e8" stroke-width="3"/>
      <path d="M370 250 h60 v28 h-60z" fill="none" stroke="#f6f1e8" stroke-width="2"/>
      <circle cx="400" cy="165" r="42" fill="#e6d3bf"/>`,
    Accessories: `<ellipse cx="400" cy="430" rx="150" ry="70" fill="url(#pat)" stroke="#f6f1e8" stroke-width="3"/>
      <path d="M280 430 h240" stroke="#c6a15b" stroke-width="3"/>
      <circle cx="400" cy="250" r="70" fill="none" stroke="#f6f1e8" stroke-width="3"/>`,
  };
  return robes[cat] || robes.Senator;
}

function plate(p) {
  const hex = p.colors?.[0]?.[1] || p.c;
  const name = p.name.replace(/&/g, "&amp;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1060">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2a241e"/>
      <stop offset="1" stop-color="#100e0c"/>
    </linearGradient>
    ${pattern(p.cat, hex)}
  </defs>
  <rect width="800" height="1060" fill="url(#bg)"/>
  <circle cx="640" cy="160" r="180" fill="${hex}" opacity=".25"/>
  <text x="56" y="90" fill="#c6a15b" font-family="Georgia" font-size="22" letter-spacing="6">JTC</text>
  <text x="56" y="122" fill="#f6f1e8" font-family="Georgia" font-size="18" opacity=".8">${p.cat}</text>
  ${silhouette(p.cat)}
  <rect x="48" y="930" width="704" height="86" rx="8" fill="#f6f1e8"/>
  <text x="72" y="982" fill="#14110e" font-family="Georgia" font-size="32">${name}</text>
</svg>`;
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
fs.mkdirSync(assetDir, { recursive: true });
fs.mkdirSync(path.dirname(reviewPath), { recursive: true });

const reviews = [];
for (const p of catalog) {
  const x = extra[p.id] || { stock: 8, rating: 4.5, season: "House", colors: [["House", p.c]], details: ["Made to measure"], care: "Ask the studio." };
  p.stock = x.stock;
  p.rating = x.rating;
  p.season = x.season;
  p.colors = x.colors.map(([name, hex]) => ({ name, hex }));
  p.details = x.details;
  p.care = x.care;
  p.sku = "JTC-" + String(p.id + 1).padStart(3, "0");
  const file = path.basename(p.img).replace(/\.jpe?g$/i, ".svg");
  p.img = "assets/products/" + file;
  fs.writeFileSync(path.join(assetDir, file), plate(p));
  const n = 2 + (p.featured ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const q = quotes[(p.id + i) % quotes.length];
    reviews.push({
      id: `${p.id}-${i}`,
      productId: p.id,
      name: q[1],
      city: q[2],
      rating: Math.min(5, Math.round(p.rating)),
      text: q[0],
      created: new Date(Date.now() - (p.id * 3 + i) * 864e5).toISOString(),
    });
  }
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
fs.writeFileSync(reviewPath, JSON.stringify(reviews, null, 2));
console.log("plates", catalog.length, "reviews", reviews.length);
