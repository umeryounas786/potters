/**
 * Reads src/assets/manifest.json and updates src/data/products.ts and
 * src/data/categories.ts with local image paths, descriptions, and prices.
 * Run: node apply-manifest.js
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const manifest      = JSON.parse(readFileSync(join(__dirname, 'src/assets/manifest.json'), 'utf8'));
let productsSrc     = readFileSync(join(__dirname, 'src/data/products.ts'), 'utf8');
let categoriesSrc   = readFileSync(join(__dirname, 'src/data/categories.ts'), 'utf8');

function formatPKR(priceStr) {
  if (!priceStr) return null;
  const n = parseFloat(priceStr);
  if (isNaN(n)) return null;
  // e.g. 5999.00 → "Rs.5,999.00 PKR"
  const parts = n.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `Rs.${parts[0]}.${parts[1]} PKR`;
}

function escapeForTS(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').slice(0, 600);
}

// ── Update products.ts ───────────────────────────────────────────────────────
let prodUpdated = 0;

for (const mp of manifest.products) {
  const hasImage = !!mp.localPath;
  const hasDesc  = !!mp.description;
  const hasPrice = !!mp.price;
  if (!hasImage && !hasDesc && !hasPrice) continue;

  // Find the product object by id field, handling multi-line objects
  const idLiteral = mp.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\{[^{}]*\\bid\\s*:\\s*["']${idLiteral}["'][^{}]*\\}`, 's');
  const match = productsSrc.match(regex);
  if (!match) { console.warn(`  ⚠ No block found for id="${mp.id}"`); continue; }

  let block = match[0];
  const original = block;

  // imageSrc → local path
  if (hasImage) {
    block = block.replace(
      /(\bimageSrc\s*:\s*)["'][^"']*["']/,
      `$1"/${mp.localPath}"`
    );
  }

  // description
  if (hasDesc) {
    const escaped = escapeForTS(mp.description);
    if (/\bdescription\s*:/.test(block)) {
      block = block.replace(/(\bdescription\s*:\s*)["'][^"']*["']/, `$1"${escaped}"`);
    } else {
      block = block.replace(/(\s*)\}$/, `, description: "${escaped}" }`);
    }
  }

  // price
  const currentPrice  = formatPKR(mp.price);
  const comparePrice  = parseFloat(mp.comparePrice || '0');
  const currentFloat  = parseFloat(mp.price || '0');
  const hasCompare    = mp.comparePrice && comparePrice > currentFloat;
  const originalPrice = hasCompare ? formatPKR(mp.comparePrice) : null;

  if (currentPrice) {
    block = block.replace(/(\bcurrentPrice\s*:\s*)["'][^"']*["']/, `$1"${currentPrice}"`);
  }

  if (originalPrice) {
    if (/\boriginalPrice\s*:/.test(block)) {
      block = block.replace(/(\boriginalPrice\s*:\s*)["'][^"']*["']/, `$1"${originalPrice}"`);
    } else {
      block = block.replace(
        /(\bcurrentPrice\s*:\s*["'][^"']*["'])/,
        `$1, originalPrice: "${originalPrice}"`
      );
    }
    block = block.replace(/(\bisSale\s*:\s*)(true|false)/, '$1true');
  } else if (hasPrice && !hasCompare) {
    // no sale
    block = block.replace(/(\bisSale\s*:\s*)(true|false)/, '$1false');
    block = block.replace(/,?\s*\boriginalPrice\s*:\s*["'][^"']*["']/, '');
  }

  if (block !== original) {
    productsSrc = productsSrc.replace(original, block);
    prodUpdated++;
  }
}

// ── Update categories.ts ─────────────────────────────────────────────────────
let catUpdated = 0;

for (const [slug, catData] of Object.entries(manifest.categories)) {
  if (!catData.localPath) continue;
  const slugLiteral = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\{[^{}]*\\bslug\\s*:\\s*["']${slugLiteral}["'][^{}]*\\}`, 's');
  const match = categoriesSrc.match(regex);
  if (!match) continue;

  const original = match[0];
  const updated  = original.replace(
    /(\bimageSrc\s*:\s*)["'][^"']*["']/,
    `$1"/${catData.localPath}"`
  );
  if (updated !== original) {
    categoriesSrc = categoriesSrc.replace(original, updated);
    catUpdated++;
  }
}

// ── Write results ────────────────────────────────────────────────────────────
writeFileSync(join(__dirname, 'src/data/products.ts'), productsSrc, 'utf8');
writeFileSync(join(__dirname, 'src/data/categories.ts'), categoriesSrc, 'utf8');

console.log(`products.ts   — ${prodUpdated} products updated`);
console.log(`categories.ts — ${catUpdated} categories updated`);

// ── Summary of what was applied ──────────────────────────────────────────────
const withImg   = manifest.products.filter(p => p.localPath).length;
const withDesc  = manifest.products.filter(p => p.description).length;
const withPrice = manifest.products.filter(p => p.price).length;
console.log(`\nManifest coverage:`);
console.log(`  ${withImg}  products with local images`);
console.log(`  ${withDesc} products with descriptions`);
console.log(`  ${withPrice} products with live prices`);
