/**
 * Replaces the generated vector product/collection imagery with real photos
 * (free Pexels stock, attached by URL so Shopify hosts its own copy).
 * Run: pnpm images:real
 */
import { BASE, HEADERS } from './config.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function rest(method, path, body) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${BASE}${path}`, { method, headers: HEADERS, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 429) { await sleep(2000); continue; }
    const text = await res.text();
    let json; try { json = text ? JSON.parse(text) : {}; } catch { json = text; }
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${typeof json === 'string' ? json : JSON.stringify(json.errors || json)}`);
    await sleep(550);
    return json;
  }
  throw new Error(`${method} ${path} → repeated 429s`);
}

// Pexels CDN — cropped to a uniform 4:5 portrait
const px = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1500&fit=crop`;

// handle → [primary, alt, alt]  (verified real skincare photos)
const productImages = {
  'hydrating-hyaluronic-serum': [4841353, 4841273, 8101520],
  'vitamin-c-brightening-serum': [34939744, 8101520, 4841273],
  'gentle-gel-cleanser': [6689393, 8101520, 5240623],
  'barrier-repair-moisturizer': [4841273, 8101520, 5240623],
  'spf-50-mineral-sunscreen': [3999057, 6689393, 8101520],
  'the-complete-routine-kit': [5240623, 4841273, 8101520]
};
const collectionImages = {
  hydration: 4841353,
  brightening: 34939744,
  'barrier-repair': 4841273,
  'best-sellers': 5240623
};

async function findId(listPath, key, handle) {
  const data = await rest('GET', `${listPath}?handle=${handle}&limit=1`);
  return (data[key] || [])[0]?.id || null;
}

async function main() {
  console.log(`→ Setting real images on ${BASE.split('/admin')[0].replace('https://', '')}\n`);

  console.log('Products');
  for (const [handle, ids] of Object.entries(productImages)) {
    const id = await findId('/products.json', 'products', handle);
    if (!id) { console.log('  ✗', handle, 'not found'); continue; }
    // remove existing images
    const cur = await rest('GET', `/products/${id}/images.json`);
    for (const img of cur.images || []) await rest('DELETE', `/products/${id}/images/${img.id}.json`);
    // add real ones (first = featured)
    for (let i = 0; i < ids.length; i++) {
      await rest('POST', `/products/${id}/images.json`, { image: { src: px(ids[i]), position: i + 1, alt: handle.replace(/-/g, ' ') } });
    }
    console.log(`  ✓ ${handle} → ${ids.length} real photos`);
  }

  console.log('\nCollections');
  for (const [handle, imgId] of Object.entries(collectionImages)) {
    const id = await findId('/smart_collections.json', 'smart_collections', handle);
    if (!id) { console.log('  ✗', handle, 'not found'); continue; }
    await rest('PUT', `/smart_collections/${id}.json`, { smart_collection: { id, image: { src: px(imgId) } } });
    console.log(`  ✓ ${handle} tile updated`);
  }

  console.log('\n✓ Done. Real imagery applied. (Shopify processes new images within a few seconds.)');
}
main().catch((e) => { console.error('\n✗', e.message); process.exit(1); });
