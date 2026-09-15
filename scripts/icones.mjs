// Génère les icônes PWA (casque de chantier stylisé). `node scripts/icones.mjs` (sharp requis, via NODE_PATH si absent)
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0f2a4a"/>
  <path d="M116 330 v-40 a140 140 0 0 1 280 0 v40 z" fill="#f5b400"/>
  <rect x="236" y="120" width="40" height="70" rx="10" fill="#f5b400"/>
  <rect x="84" y="330" width="344" height="36" rx="18" fill="#ffffff"/>
  <path d="M300 405 h100 M300 435 h100" stroke="#ffffff" stroke-width="14" stroke-linecap="round" opacity="0.7"/>
</svg>`;
mkdirSync("public/icons", { recursive: true });
for (const taille of [192, 512]) {
  await sharp(Buffer.from(svg)).resize(taille, taille).png().toFile(`public/icons/icon-${taille}.png`);
}
console.log("icônes générées");
