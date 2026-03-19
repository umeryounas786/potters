/**
 * Arraish.com Asset Scraper — v3
 *
 * Fetches FULL product data (title, description, price, images) from
 * Shopify's collections API, downloads images locally, and rewrites
 * src/data/products.ts with updated imageSrc, description, currentPrice,
 * originalPrice, isSale so the website uses real live data.
 *
 * Run:  node scraper.js
 * Options:
 *   --dry-run         Show what would be done, no writes
 *   --no-update-ts    Skip rewriting the .ts data files
 *   --concurrency=N   Parallel downloads (default: 5)
 */

import { createWriteStream, mkdirSync, existsSync, writeFileSync, readFileSync, statSync } from 'fs';
import { get as httpsGet } from 'https';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ─── Config ──────────────────────────────────────────────────────────────────

const SRC_DIR         = join(__dirname, 'src');
const ASSETS_DIR      = join(SRC_DIR, 'assets');
const IMAGES_DIR      = join(ASSETS_DIR, 'images');
const MANIFEST_PATH   = join(ASSETS_DIR, 'manifest.json');
const PRODUCTS_FILE   = join(SRC_DIR, 'data', 'products.ts');
const CATEGORIES_FILE = join(SRC_DIR, 'data', 'categories.ts');

const BASE_URL    = 'https://www.arraish.com';
const DRY_RUN     = process.argv.includes('--dry-run');
const NO_UPDATE   = process.argv.includes('--no-update-ts');
const CONCURRENCY = (() => {
  const f = process.argv.find(a => a.startsWith('--concurrency='));
  return f ? parseInt(f.split('=')[1], 10) : 5;
})();
const API_DELAY = 400; // ms between API calls

// Collections to scrape — in the order they appear in categories.ts
const COLLECTIONS = [
  'plates-platters',
  'bowls',
  'serving-dishes',
  'ceramic-blue-pottery-karahies',
  'tea-sets-blue-pottery',
  'dinner-sets',
  'vases',
  'planters',
  'pottery-jars',
  'lamps',
  'table-decoration',
];

// ─── Utilities ────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

function toSlug(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function normalizeTitle(t) {
  return (t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getFilenameFromUrl(url) {
  try {
    return new URL(url).pathname.split('/').pop().replace(/\?\S*$/, '') || 'image.jpg';
  } catch { return 'image.jpg'; }
}

function formatPKR(priceStr) {
  if (!priceStr) return null;
  const n = parseFloat(priceStr);
  if (isNaN(n)) return null;
  return `Rs.${n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PKR`;
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const req = httpsGet(
      url,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AssetScraper/3.0)' } },
      (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return fetchJSON(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const req = httpsGet(
      url,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AssetScraper/3.0)' } },
      (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const f = createWriteStream(destPath);
        res.pipe(f);
        f.on('finish', () => f.close(resolve));
        f.on('error', err => { f.close(); reject(err); });
      }
    );
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function runWithConcurrency(tasks, limit) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < tasks.length) { const idx = i++; results[idx] = await tasks[idx](); }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

// ─── Shopify collection fetcher ───────────────────────────────────────────────

/**
 * Fetch ALL products from a Shopify collection (handles pagination).
 * Returns array of Shopify product objects.
 */
async function fetchCollectionProducts(slug) {
  const all = [];
  let page = 1;
  while (true) {
    const url = `${BASE_URL}/collections/${slug}/products.json?limit=250&page=${page}`;
    try {
      const json = await fetchJSON(url);
      const batch = json.products || [];
      all.push(...batch);
      if (batch.length < 250) break;
      page++;
      await sleep(API_DELAY);
    } catch (err) {
      console.warn(`\n  ⚠ Collection "${slug}" p${page}: ${err.message}`);
      break;
    }
  }
  return all;
}

// ─── Parse existing TS files ──────────────────────────────────────────────────

function extractObjectStrings(source) {
  const objects = [];
  let depth = 0, start = -1;
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '{') { if (depth === 0) start = i; depth++; }
    else if (source[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) { objects.push(source.slice(start, i + 1)); start = -1; }
    }
  }
  return objects;
}

function extractField(obj, field) {
  const m = obj.match(new RegExp(`\\b${field}\\s*:\\s*["']([^"']+)["']`));
  return m ? m[1] : null;
}

function parseExistingProducts(source) {
  return extractObjectStrings(source)
    .map(obj => ({
      id:           extractField(obj, 'id'),
      productName:  extractField(obj, 'productName'),
      productHref:  extractField(obj, 'productHref'),
      imageSrc:     extractField(obj, 'imageSrc'),
      imageAlt:     extractField(obj, 'imageAlt'),
      category:     extractField(obj, 'category'),
      designFamily: extractField(obj, 'designFamily'),
      raw:          obj,
    }))
    .filter(p => p.id && p.productName);
}

function parseExistingCategories(source) {
  return extractObjectStrings(source)
    .map(obj => ({
      slug:     extractField(obj, 'slug'),
      title:    extractField(obj, 'title'),
      imageSrc: extractField(obj, 'imageSrc'),
      raw:      obj,
    }))
    .filter(c => c.slug);
}

// ─── TS file updater ──────────────────────────────────────────────────────────

/**
 * Rebuild one product object string with updated fields.
 * Only replaces fields that have new values.
 */
function rebuildProductObj(raw, updates) {
  let result = raw;

  // imageSrc
  if (updates.imageSrc) {
    result = result.replace(
      /(\bimageSrc\s*:\s*)["'][^"']*["']/,
      `$1"${updates.imageSrc}"`
    );
  }

  // description — insert or replace
  if (updates.description) {
    const escaped = updates.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    if (/\bdescription\s*:/.test(result)) {
      result = result.replace(/(\bdescription\s*:\s*)["'][^"']*["']/, `$1"${escaped}"`);
    } else {
      // insert before closing brace
      result = result.replace(/\s*\}$/, `, description: "${escaped}" }`);
    }
  }

  // currentPrice
  if (updates.currentPrice) {
    result = result.replace(
      /(\bcurrentPrice\s*:\s*)["'][^"']*["']/,
      `$1"${updates.currentPrice}"`
    );
  }

  // originalPrice — insert or replace
  if (updates.originalPrice !== undefined) {
    if (/\boriginalPrice\s*:/.test(result)) {
      if (updates.originalPrice) {
        result = result.replace(
          /(\boriginalPrice\s*:\s*)["'][^"']*["']/,
          `$1"${updates.originalPrice}"`
        );
      } else {
        // remove originalPrice if null
        result = result.replace(/,?\s*\boriginalPrice\s*:\s*["'][^"']*["']/, '');
      }
    } else if (updates.originalPrice) {
      result = result.replace(/(\bcurrentPrice\s*:\s*["'][^"']*["'])/, `$1, originalPrice: "${updates.originalPrice}"`);
    }
  }

  // isSale
  if (updates.isSale !== undefined) {
    result = result.replace(/(\bisSale\s*:\s*)(true|false)/, `$1${updates.isSale}`);
  }

  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('══════════════════════════════════════════════');
  console.log('  Arraish Asset Scraper v3');
  console.log('══════════════════════════════════════════════');
  if (DRY_RUN) console.log('  [DRY RUN]\n');

  // ── 1. Read existing TS files ──────────────────────────────────────────────
  const productsSrc    = readFileSync(PRODUCTS_FILE, 'utf8');
  const categoriesSrc  = readFileSync(CATEGORIES_FILE, 'utf8');
  const existingProds  = parseExistingProducts(productsSrc);
  const existingCats   = parseExistingCategories(categoriesSrc);

  // Build lookup: normalizedTitle → existing product
  const existingByTitle = new Map();
  for (const p of existingProds) {
    existingByTitle.set(normalizeTitle(p.productName), p);
  }

  console.log(`\nExisting products in TS: ${existingProds.length}`);
  console.log(`Collections to scrape: ${COLLECTIONS.length}\n`);

  if (DRY_RUN) {
    console.log('Collections that would be fetched:');
    COLLECTIONS.forEach(c => console.log(`  ${BASE_URL}/collections/${c}/products.json`));
    return;
  }

  // ── 2. Fetch all products from each Shopify collection ────────────────────
  console.log('Fetching product data from Shopify collections API...');

  /** Map: normalizedTitle → { shopifyProduct, collection } */
  const shopifyByTitle = new Map();
  let totalFetched = 0;

  for (const slug of COLLECTIONS) {
    process.stdout.write(`  ${slug.padEnd(40)}`);
    const products = await fetchCollectionProducts(slug);
    for (const p of products) {
      const key = normalizeTitle(p.title);
      if (!shopifyByTitle.has(key)) {
        shopifyByTitle.set(key, { product: p, collection: slug });
      }
    }
    totalFetched += products.length;
    console.log(`→ ${products.length} products`);
    await sleep(API_DELAY);
  }

  console.log(`\n  Total fetched: ${totalFetched}, unique titles: ${shopifyByTitle.size}\n`);

  // ── 3. Match existing products → Shopify data ─────────────────────────────
  // Build download plan
  const plan = []; // { url, destDir, filename, localPath, existingId, updates }

  mkdirSync(join(IMAGES_DIR, 'categories'), { recursive: true });

  let matched = 0, unmatched = 0;

  for (const ep of existingProds) {
    const key = normalizeTitle(ep.productName);
    const found = shopifyByTitle.get(key);

    if (!found) {
      unmatched++;
      continue;
    }

    matched++;
    const { product: sp, collection } = found;
    const catSlug = toSlug(ep.category || collection || 'misc');
    mkdirSync(join(IMAGES_DIR, catSlug), { recursive: true });

    const imageUrl = sp.images && sp.images[0] ? sp.images[0].src : null;
    const filename = imageUrl ? getFilenameFromUrl(imageUrl) : null;
    const localPath = filename ? `assets/images/${catSlug}/${filename}` : null;

    const price         = sp.variants && sp.variants[0] ? sp.variants[0].price : null;
    const comparePrice  = sp.variants && sp.variants[0] ? sp.variants[0].compare_at_price : null;
    const currentPrice  = formatPKR(price);
    const originalPrice = comparePrice && parseFloat(comparePrice) > parseFloat(price || '0')
      ? formatPKR(comparePrice) : null;
    const isSale        = !!(originalPrice);
    const description   = stripHtml(sp.body_html);

    if (imageUrl && filename) {
      plan.push({
        url:       imageUrl,
        destDir:   join(IMAGES_DIR, catSlug),
        filename,
        localPath,
        existingId: ep.id,
        updates: {
          imageSrc:      `/${localPath}`,
          description:   description || undefined,
          currentPrice:  currentPrice || undefined,
          originalPrice: originalPrice,
          isSale,
        },
      });
    }
  }

  console.log(`Matched: ${matched} products, Unmatched: ${unmatched}\n`);

  // Category images: take first product image from each collection
  for (const cat of existingCats) {
    const slug = cat.slug;
    const colProducts = [...shopifyByTitle.values()]
      .filter(v => v.collection === slug)
      .map(v => v.product);
    if (!colProducts.length) continue;
    const imageUrl = colProducts[0].images && colProducts[0].images[0]
      ? colProducts[0].images[0].src : null;
    if (!imageUrl) continue;
    const filename = getFilenameFromUrl(imageUrl);
    plan.push({
      url:       imageUrl,
      destDir:   join(IMAGES_DIR, 'categories'),
      filename,
      localPath: `assets/images/categories/${filename}`,
      categorySlug: slug,
      updates:   { imageSrc: `/assets/images/categories/${filename}` },
    });
  }

  // Deduplicate by URL
  const seenUrls = new Set();
  const uniquePlan = plan.filter(item => {
    if (seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });

  console.log(`Download plan: ${uniquePlan.length} images`);
  console.log(`  Category images : ${uniquePlan.filter(i => i.categorySlug).length}`);
  console.log(`  Product images  : ${uniquePlan.filter(i => i.existingId).length}\n`);

  // ── 4. Download images ────────────────────────────────────────────────────
  let done = 0, skipped = 0, failed = 0;
  const errors = [];

  const tasks = uniquePlan.map(item => async () => {
    const destPath = join(item.destDir, item.filename);
    if (existsSync(destPath) && statSync(destPath).size > 0) {
      skipped++;
      process.stdout.write(`\r  ✓ ${done + skipped}/${uniquePlan.length} (${skipped} cached, ${failed} failed)   `);
      return { ...item, downloaded: false };
    }
    try {
      await downloadFile(item.url, destPath);
      done++;
    } catch (err) {
      failed++;
      errors.push({ url: item.url, id: item.existingId || item.categorySlug, error: err.message });
    }
    process.stdout.write(`\r  ↓ ${done + skipped}/${uniquePlan.length} (${skipped} cached, ${failed} failed)   `);
    return { ...item, downloaded: true };
  });

  console.log(`Downloading with concurrency=${CONCURRENCY}...\n`);
  await runWithConcurrency(tasks, CONCURRENCY);
  console.log('\n');

  // ── 5. Write manifest.json ────────────────────────────────────────────────
  const manifest = {
    generatedAt: new Date().toISOString(),
    summary: { totalImages: uniquePlan.length, downloaded: done, cached: skipped, failed },
    products: [],
    categories: {},
  };

  // Add full Shopify data to manifest for every matched product
  for (const ep of existingProds) {
    const key = normalizeTitle(ep.productName);
    const found = shopifyByTitle.get(key);
    const sp = found ? found.product : null;
    const planItem = uniquePlan.find(i => i.existingId === ep.id);

    manifest.products.push({
      id:           ep.id,
      productName:  sp ? sp.title : ep.productName,
      category:     ep.category,
      designFamily: ep.designFamily || null,
      isSale:       planItem?.updates.isSale ?? false,
      currentPrice: planItem?.updates.currentPrice || null,
      originalPrice: planItem?.updates.originalPrice || null,
      description:  planItem?.updates.description || null,
      imageAlt:     ep.imageAlt,
      productHref:  ep.productHref,
      localImagePath: planItem?.localPath || null,
      originalImageUrl: sp?.images?.[0]?.src || null,
      allImages:    sp?.images?.map(img => img.src) || [],
      shopifyId:    sp?.id || null,
      tags:         sp?.tags || [],
    });
  }

  // Categories in manifest
  for (const cat of existingCats) {
    const planItem = uniquePlan.find(i => i.categorySlug === cat.slug);
    manifest.categories[cat.slug] = {
      title:     cat.title,
      slug:      cat.slug,
      localImagePath: planItem?.localPath || null,
      originalImageUrl: planItem?.url || null,
    };
  }

  if (errors.length) manifest.errors = errors;

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Manifest written → src/assets/manifest.json`);
  console.log(`  Contains full product data: title, description, prices, image paths, tags\n`);

  // ── 6. Update products.ts and categories.ts ───────────────────────────────
  if (NO_UPDATE) {
    console.log('[--no-update-ts] Skipped TS file updates.');
  } else {
    console.log('Updating src/data/products.ts with live data...');

    // Build map: id → updates
    const updatesById = new Map();
    for (const item of uniquePlan) {
      if (item.existingId) updatesById.set(item.existingId, item.updates);
    }

    let updatedProductsSrc = productsSrc;
    let replacedCount = 0;

    for (const ep of existingProds) {
      const updates = updatesById.get(ep.id);
      if (!updates) continue;
      const newObj = rebuildProductObj(ep.raw, updates);
      if (newObj !== ep.raw) {
        updatedProductsSrc = updatedProductsSrc.replace(ep.raw, newObj);
        replacedCount++;
      }
    }

    if (replacedCount > 0) {
      writeFileSync(PRODUCTS_FILE, updatedProductsSrc, 'utf8');
      console.log(`  ✓ products.ts updated (${replacedCount} products)`);
    } else {
      console.log('  No changes needed in products.ts');
    }

    // Update categories.ts imageSrc
    console.log('Updating src/data/categories.ts with live data...');
    let updatedCatsSrc = categoriesSrc;
    let catReplacedCount = 0;

    for (const cat of existingCats) {
      const planItem = uniquePlan.find(i => i.categorySlug === cat.slug && cat.imageSrc);
      if (!planItem) continue;
      const newObj = cat.raw.replace(
        /(\bimageSrc\s*:\s*)["'][^"']*["']/,
        `$1"/${planItem.localPath}"`
      );
      if (newObj !== cat.raw) {
        updatedCatsSrc = updatedCatsSrc.replace(cat.raw, newObj);
        catReplacedCount++;
      }
    }

    if (catReplacedCount > 0) {
      writeFileSync(CATEGORIES_FILE, updatedCatsSrc, 'utf8');
      console.log(`  ✓ categories.ts updated (${catReplacedCount} categories)`);
    } else {
      console.log('  No changes needed in categories.ts');
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  console.log('  Done!');
  console.log('══════════════════════════════════════════════');
  console.log(`  Shopify products fetched : ${totalFetched}`);
  console.log(`  Matched to TS data       : ${matched}`);
  console.log(`  Images downloaded        : ${done}`);
  console.log(`  Images cached            : ${skipped}`);
  console.log(`  Download failures        : ${failed}`);
  console.log(`  Manifest                 : src/assets/manifest.json`);

  if (errors.length) {
    console.log(`\n  Failed downloads:`);
    errors.forEach(e => console.log(`    ✗ [${e.id}] ${e.error}`));
  }
  console.log('');
}

main().catch(err => { console.error('\nFatal error:', err); process.exit(1); });
