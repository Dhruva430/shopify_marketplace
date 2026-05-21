/**
 * Seeds the Shopify store with everything the storefront needs:
 *   • 6 products (with variants, SEO, tags, metafields) + their 3 images each
 *   • 4 smart collections (hydration / brightening / barrier-repair / best-sellers) + tiles
 *   • 6 pages (About, Contact, FAQ, Shipping & Returns, Privacy, Terms) with theme templates
 *   • Main + Footer navigation menus
 *   • Publishes products & collections to the Online Store sales channel
 *
 * Idempotent: re-running skips anything that already exists (matched by handle).
 *
 * Setup:
 *   1) Shopify admin → Settings → Apps and sales channels → Develop apps → Create an app
 *   2) Admin API scopes: write_products, read_products, write_publications, read_publications,
 *      write_content, write_online_store_navigation, read_online_store_navigation
 *   3) Install app → reveal the Admin API access token (shpat_…)
 *   4) Create a .env file in the repo root:
 *        SHOPIFY_STORE=fetchwell-edyplil9.myshopify.com
 *        SHOPIFY_ADMIN_TOKEN=shpat_xxxxxxxxxxxxxxxx
 *   5) Run:  pnpm seed
 */
import { readFileSync, existsSync } from 'node:fs';
import { STORE, BASE, HEADERS as HEAD, API_VERSION as API } from './config.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rest(method, path, body) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${BASE}${path}`, { method, headers: HEAD, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 429) { await sleep(2000); continue; }
    const text = await res.text();
    let json; try { json = text ? JSON.parse(text) : {}; } catch { json = text; }
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${typeof json === 'string' ? json : JSON.stringify(json.errors || json)}`);
    await sleep(550); // stay under 2 req/s
    return json;
  }
  throw new Error(`${method} ${path} → repeated 429s`);
}
async function gql(query, variables) {
  const res = await fetch(`${BASE}/graphql.json`, { method: 'POST', headers: HEAD, body: JSON.stringify({ query, variables }) });
  const j = await res.json();
  if (j.errors) throw new Error('GraphQL: ' + JSON.stringify(j.errors));
  await sleep(550);
  return j.data;
}
const b64 = (file) => readFileSync(`brand/images/${file}`).toString('base64');

/* ---------- catalogue ---------- */
const P = (h) => `products/${h}`;
const products = [
  {
    handle: 'hydrating-hyaluronic-serum', title: 'Hydrating Hyaluronic Serum', type: 'Serum',
    body: '<p>A weightless daily serum powered by multi-weight <strong>hyaluronic acid</strong> and <strong>5% vitamin B5</strong> to flood skin with moisture and visibly plump in two weeks. Fragrance-free and suitable for sensitive skin.</p><ul><li>Up to 72 hours of hydration</li><li>Plumps fine lines &amp; smooths texture</li><li>Vegan &amp; cruelty-free</li></ul>',
    tags: ['badge:Bestseller', 'badge:Vegan', 'skin:Hydration', 'concern:Dryness', 'hydration'],
    seoTitle: 'Hydrating Hyaluronic Serum | Aurelle Skincare',
    seoDesc: 'Weightless hyaluronic acid + B5 serum for up to 72h hydration and visibly plumper skin. Vegan, fragrance-free.',
    variants: [
      { opt: '30ml', sku: 'AUR-HHS-30', price: '32.00', compare: '40.00', grams: 120, qty: 150 },
      { opt: '50ml', sku: 'AUR-HHS-50', price: '44.00', compare: '55.00', grams: 180, qty: 120 }
    ],
    ingredients: 'Sodium Hyaluronate (multi-weight), Panthenol (Pro-Vitamin B5), Glycerin, Aloe Barbadensis Leaf Juice.',
    how: '1. Apply 2–3 drops to clean, damp skin morning and night.\n2. Pat gently until absorbed.\n3. Follow with moisturiser and SPF in the AM.'
  },
  {
    handle: 'vitamin-c-brightening-serum', title: 'Vitamin C Brightening Serum', type: 'Serum',
    body: '<p>A stabilised <strong>15% vitamin C</strong> serum with ferulic acid and vitamin E that visibly brightens, evens tone and defends against daily pollution. Lightweight, fast-absorbing, and non-greasy.</p><ul><li>Fades dark spots &amp; uneven tone</li><li>Antioxidant pollution defence</li><li>Brighter, more radiant skin in 4 weeks</li></ul>',
    tags: ['badge:New', 'skin:Brightening', 'concern:Dark spots', 'brightening'],
    seoTitle: 'Vitamin C Brightening Serum | Aurelle Skincare',
    seoDesc: '15% vitamin C + ferulic acid serum to brighten, even tone and defend skin. Visibly radiant in 4 weeks.',
    variants: [{ opt: '30ml', sku: 'AUR-VCS-30', price: '38.00', compare: '48.00', grams: 130, qty: 140 }],
    ingredients: '15% Sodium Ascorbyl Phosphate (Vitamin C), Ferulic Acid, Tocopherol (Vitamin E), Niacinamide.',
    how: '1. Use in the morning on clean skin.\n2. Apply 3–4 drops before moisturiser.\n3. Always follow with SPF.'
  },
  {
    handle: 'gentle-gel-cleanser', title: 'Gentle Gel Cleanser', type: 'Cleanser',
    body: '<p>A pH-balanced gel cleanser with <strong>aloe</strong> and <strong>green tea</strong> that lifts away makeup, SPF and impurities without stripping your barrier. Leaves skin clean, calm and never tight.</p><ul><li>Non-stripping, barrier-friendly</li><li>Removes makeup &amp; SPF</li><li>For all skin types, daily use</li></ul>',
    tags: ['badge:Vegan', 'skin:Hydration', 'concern:Daily care', 'hydration', 'cleanser'],
    seoTitle: 'Gentle Gel Cleanser | Aurelle Skincare',
    seoDesc: 'pH-balanced aloe & green tea gel cleanser that removes makeup and SPF without stripping skin.',
    variants: [{ opt: '150ml', sku: 'AUR-GGC-150', price: '22.00', compare: '', grams: 210, qty: 160 }],
    ingredients: 'Aloe Barbadensis Leaf Juice, Camellia Sinensis (Green Tea) Extract, Coco-Glucoside, Glycerin.',
    how: '1. Massage a small amount onto damp skin morning and night.\n2. Rinse with lukewarm water.\n3. Follow with serum and moisturiser.'
  },
  {
    handle: 'barrier-repair-moisturizer', title: 'Barrier Repair Moisturizer', type: 'Moisturizer',
    body: '<p>A rich-yet-breathable cream with <strong>ceramides</strong>, <strong>niacinamide</strong> and squalane that rebuilds a compromised barrier, locks in moisture and calms redness overnight.</p><ul><li>Strengthens skin barrier</li><li>24-hour moisture lock</li><li>Calms redness &amp; sensitivity</li></ul>',
    tags: ['badge:Bestseller', 'skin:Barrier repair', 'concern:Sensitivity', 'barrier-repair'],
    seoTitle: 'Barrier Repair Moisturizer | Aurelle Skincare',
    seoDesc: 'Ceramide + niacinamide cream that rebuilds the skin barrier, locks in moisture and calms redness.',
    variants: [{ opt: '50ml', sku: 'AUR-BRM-50', price: '36.00', compare: '45.00', grams: 190, qty: 130 }],
    ingredients: 'Ceramide NP, Niacinamide, Squalane, Shea Butter, Glycerin.',
    how: '1. Apply a pea-sized amount as the last step morning and night.\n2. Warm between fingers and press into skin.'
  },
  {
    handle: 'spf-50-mineral-sunscreen', title: 'SPF 50 Mineral Sunscreen', type: 'Sunscreen',
    body: '<p>A weightless <strong>mineral SPF 50</strong> with zinc oxide that shields against UVA/UVB without white cast or grease. Doubles as a smoothing makeup primer for everyday wear.</p><ul><li>Broad-spectrum SPF 50 PA++++</li><li>No white cast, no grease</li><li>Reef-friendly mineral filters</li></ul>',
    tags: ['badge:New', 'badge:Vegan', 'skin:Barrier repair', 'concern:Sun protection', 'barrier-repair'],
    seoTitle: 'SPF 50 Mineral Sunscreen | Aurelle Skincare',
    seoDesc: 'Weightless mineral SPF 50 with zinc oxide — broad-spectrum protection, no white cast. Reef-friendly.',
    variants: [{ opt: '50ml', sku: 'AUR-SPF-50', price: '28.00', compare: '34.00', grams: 170, qty: 150 }],
    ingredients: 'Zinc Oxide 18%, Niacinamide, Glycerin, Tocopherol (Vitamin E).',
    how: '1. Apply as the last step of your morning routine.\n2. Use two finger-lengths for the face and neck.\n3. Reapply every 2 hours of sun exposure.'
  },
  {
    handle: 'the-complete-routine-kit', title: 'The Complete Routine Kit', type: 'Bundle',
    body: '<p>Your full clean routine in one bundle: <strong>Gentle Gel Cleanser</strong>, <strong>Hydrating Hyaluronic Serum</strong> and <strong>Barrier Repair Moisturizer</strong>. Everything your skin needs morning and night — at 20% off buying separately.</p>',
    tags: ['badge:Bestseller', 'bundle', 'value'],
    seoTitle: 'The Complete Routine Kit | Aurelle Skincare',
    seoDesc: 'Cleanser, serum and moisturiser bundle — your full Aurelle routine at 20% off. Clean, vegan, effective.',
    variants: [{ opt: '', sku: 'AUR-KIT-01', price: '89.00', compare: '112.00', grams: 520, qty: 90 }],
    ingredients: 'Includes full-size Gentle Gel Cleanser (150ml), Hydrating Hyaluronic Serum (30ml) and Barrier Repair Moisturizer (50ml).',
    how: 'AM: Cleanse → Serum → Moisturiser → SPF.  PM: Cleanse → Serum → Moisturiser.'
  }
];

const collections = [
  { handle: 'hydration', title: 'Hydration', tag: 'hydration', img: 'collection-hydration.png', body: 'Plump, quench and replenish thirsty skin.' },
  { handle: 'brightening', title: 'Brightening', tag: 'brightening', img: 'collection-brightening.png', body: 'Even tone and bring back your natural glow.' },
  { handle: 'barrier-repair', title: 'Barrier Repair', tag: 'barrier-repair', img: 'collection-barrier-repair.png', body: 'Calm, protect and strengthen your skin barrier.' },
  { handle: 'best-sellers', title: 'Best Sellers', tag: 'badge:Bestseller', img: 'collection-hydration.png', body: 'Our most-loved, most-reviewed formulas.' }
];

const pages = [
  { handle: 'about', title: 'About Us', suffix: 'about', body: '<p>Aurelle was born from a simple belief: effective skincare shouldn’t mean a 12-step routine or ingredients you can’t pronounce. We formulate with proven actives, clean standards, and full transparency.</p>' },
  { handle: 'contact', title: 'Contact Us', suffix: 'contact', body: '<p>We’d love to hear from you.</p>' },
  { handle: 'faq', title: 'FAQ', suffix: 'faq', body: '' },
  { handle: 'shipping-returns', title: 'Shipping & Returns', suffix: '', body: '<h2>Shipping</h2><p>Free standard shipping on orders over $50. Most orders ship within 1–2 business days. You’ll receive tracking by email.</p><h2>Returns</h2><p>Not in love? Return within 30 days for a full refund — even if the bottle is open.</p>' },
  { handle: 'privacy-policy', title: 'Privacy Policy', suffix: '', body: '<p>We respect your privacy. We only collect the information needed to process your orders and improve your experience, and we never sell your data. Replace this with your finalised policy (Settings → Policies can generate one).</p>' },
  { handle: 'terms-of-service', title: 'Terms of Service', suffix: '', body: '<p>By using this store you agree to our terms. Replace this with your finalised terms (Settings → Policies can generate one).</p>' }
];

/* ---------- helpers ---------- */
async function getId(listPath, key, handle) {
  const data = await rest('GET', `${listPath}?handle=${handle}&limit=1`);
  const arr = data[key] || [];
  return arr.length ? arr[0].id : null;
}

async function enrichProduct(id, p) {
  // Ensure all intended tags are present (a CSV import may have used a subset,
  // which leaves smart collections under-populated)
  try {
    const cur = await rest('GET', `/products/${id}.json?fields=id,tags`);
    const have = new Set((cur.product.tags || '').split(',').map((t) => t.trim()).filter(Boolean));
    let changed = false;
    for (const t of p.tags) if (!have.has(t)) { have.add(t); changed = true; }
    if (changed) {
      await rest('PUT', `/products/${id}.json`, { product: { id, tags: [...have].join(', ') } });
      console.log('     ~ tags reconciled');
    }
  } catch (e) { console.log('     ! tags:', e.message); }
  // Add images if the product has none (CSV imports come in without images)
  try {
    const imgs = await rest('GET', `/products/${id}/images.json`);
    const count = (imgs.images || []).length;
    const files = [`${P(p.handle)}-1.png`, `${P(p.handle)}-2.png`, `${P(p.handle)}-3.png`];
    const haveFiles = files.every((f) => existsSync(`brand/images/${f}`));
    if (count < 3 && haveFiles) {
      for (let i = 0; i < files.length; i++) {
        await rest('POST', `/products/${id}/images.json`, { image: { attachment: b64(files[i]), position: i + 1, alt: p.title } });
      }
      console.log(`     + added ${files.length} images${count ? ` (kept ${count} existing as extras)` : ''}`);
    } else {
      console.log(`     · images already present (${count})`);
    }
  } catch (e) { console.log('     ! images:', e.message); }
  // Add ingredient / how-to-use metafields if missing
  try {
    const mf = await rest('GET', `/products/${id}/metafields.json?namespace=custom`);
    const have = new Set((mf.metafields || []).map((m) => m.key));
    for (const w of [{ key: 'ingredients', value: p.ingredients }, { key: 'how_to_use', value: p.how }]) {
      if (!have.has(w.key)) {
        await rest('POST', `/products/${id}/metafields.json`, { metafield: { namespace: 'custom', key: w.key, type: 'multi_line_text_field', value: w.value } });
        console.log(`     + metafield custom.${w.key}`);
      }
    }
  } catch (e) { console.log('     ! metafields:', e.message); }
}

let onlineStorePubId = null;
async function publish(gidType, numericId) {
  if (!onlineStorePubId) return;
  const gid = `gid://shopify/${gidType}/${numericId}`;
  try {
    const d = await gql(
      `mutation pub($id:ID!,$pid:ID!){ publishablePublish(id:$id, input:[{publicationId:$pid}]){ userErrors{message} } }`,
      { id: gid, pid: onlineStorePubId }
    );
    const errs = d.publishablePublish.userErrors;
    if (errs.length) console.log('   ! publish:', errs.map((e) => e.message).join('; '));
  } catch (e) { /* already published / scope */ }
}

/* ---------- run ---------- */
async function main() {
  console.log(`→ Seeding ${STORE}\n`);

  // Find the Online Store publication (for publishing products/collections)
  try {
    const d = await gql(`{ publications(first:20){ nodes{ id name } } }`);
    const os = d.publications.nodes.find((n) => n.name === 'Online Store');
    onlineStorePubId = os ? os.id : null;
    console.log(onlineStorePubId ? '✓ Online Store channel found\n' : '! Online Store channel not found (products may need manual publish)\n');
  } catch (e) { console.log('! Could not query publications:', e.message, '\n'); }

  // Products
  console.log('Products');
  for (const p of products) {
    const existing = await getId('/products.json', 'products', p.handle);
    if (existing) { console.log('  =', p.handle, '(exists) — enriching'); await enrichProduct(existing, p); await publish('Product', existing); continue; }
    const hasOptions = p.variants.some((v) => v.opt);
    const payload = {
      product: {
        title: p.title, handle: p.handle, body_html: p.body, vendor: 'Aurelle',
        product_type: p.type, tags: p.tags.join(', '), status: 'active',
        options: hasOptions ? [{ name: 'Size' }] : undefined,
        variants: p.variants.map((v) => ({
          option1: v.opt || undefined, sku: v.sku, price: v.price,
          compare_at_price: v.compare || null, grams: v.grams, weight: v.grams / 1000, weight_unit: 'kg',
          inventory_management: 'shopify', inventory_quantity: v.qty, inventory_policy: 'deny'
        })),
        images: [`${P(p.handle)}-1.png`, `${P(p.handle)}-2.png`, `${P(p.handle)}-3.png`].map((f, i) => ({ attachment: b64(f), position: i + 1, alt: p.title })),
        metafields: [
          { namespace: 'custom', key: 'ingredients', type: 'multi_line_text_field', value: p.ingredients },
          { namespace: 'custom', key: 'how_to_use', type: 'multi_line_text_field', value: p.how }
        ],
        metafields_global_title_tag: p.seoTitle,
        metafields_global_description_tag: p.seoDesc
      }
    };
    const res = await rest('POST', '/products.json', payload);
    console.log('  +', p.handle, `(#${res.product.id}, ${res.product.images.length} images)`);
    await publish('Product', res.product.id);
  }

  // Collections (smart, by tag)
  console.log('\nCollections');
  for (const c of collections) {
    const existing = await getId('/smart_collections.json', 'smart_collections', c.handle);
    if (existing) { console.log('  =', c.handle, '(exists, skipped)'); await publish('Collection', existing); continue; }
    const res = await rest('POST', '/smart_collections.json', {
      smart_collection: {
        title: c.title, handle: c.handle, body_html: `<p>${c.body}</p>`, published: true,
        rules: [{ column: 'tag', relation: 'equals', condition: c.tag }],
        image: { attachment: b64(c.img), alt: c.title }
      }
    });
    console.log('  +', c.handle, `(#${res.smart_collection.id})`);
    await publish('Collection', res.smart_collection.id);
  }

  // Pages
  console.log('\nPages');
  for (const pg of pages) {
    const existing = await getId('/pages.json', 'pages', pg.handle);
    if (existing) { console.log('  =', pg.handle, '(exists, skipped)'); continue; }
    const res = await rest('POST', '/pages.json', {
      page: { title: pg.title, handle: pg.handle, body_html: pg.body, published: true, template_suffix: pg.suffix || null }
    });
    console.log('  +', pg.handle, pg.suffix ? `(template: page.${pg.suffix})` : '(template: default)');
  }

  // Menus
  console.log('\nMenus');
  await seedMenus();

  console.log('\n✓ Done. Open the storefront preview to see it populated.');
}

async function seedMenus() {
  const main = [
    { title: 'Shop', url: '/collections/all' },
    { title: 'Hydration', url: '/collections/hydration' },
    { title: 'Brightening', url: '/collections/brightening' },
    { title: 'Bundles', url: '/products/the-complete-routine-kit' },
    { title: 'About', url: '/pages/about' },
    { title: 'Contact', url: '/pages/contact' }
  ];
  const footer = [
    { title: 'About', url: '/pages/about' },
    { title: 'FAQ', url: '/pages/faq' },
    { title: 'Shipping & Returns', url: '/pages/shipping-returns' },
    { title: 'Privacy Policy', url: '/pages/privacy-policy' },
    { title: 'Terms of Service', url: '/pages/terms-of-service' },
    { title: 'Contact', url: '/pages/contact' }
  ];
  const toItems = (arr) => arr.map((i) => ({ title: i.title, type: 'HTTP', url: i.url }));
  try {
    const d = await gql(`{ menus(first:30){ nodes{ id handle title } } }`);
    const find = (h) => d.menus.nodes.find((n) => n.handle === h);
    for (const [handle, title, items] of [['main-menu', 'Main menu', main], ['footer', 'Footer', footer]]) {
      const existing = find(handle);
      if (existing) {
        const r = await gql(
          `mutation u($id:ID!,$t:String!,$h:String!,$i:[MenuItemUpdateInput!]!){ menuUpdate(id:$id,title:$t,handle:$h,items:$i){ userErrors{message} } }`,
          { id: existing.id, t: title, h: handle, i: toItems(items) }
        );
        const e = r.menuUpdate.userErrors;
        console.log(e.length ? `  ! ${handle}: ${e.map((x) => x.message).join('; ')}` : `  ~ ${handle} (updated, ${items.length} links)`);
      } else {
        const r = await gql(
          `mutation c($t:String!,$h:String!,$i:[MenuItemCreateInput!]!){ menuCreate(title:$t,handle:$h,items:$i){ userErrors{message} } }`,
          { t: title, h: handle, i: toItems(items) }
        );
        const e = r.menuCreate.userErrors;
        console.log(e.length ? `  ! ${handle}: ${e.map((x) => x.message).join('; ')}` : `  + ${handle} (created, ${items.length} links)`);
      }
    }
  } catch (e) {
    console.log('  ! Menu automation skipped:', e.message);
    console.log('    → Add menus manually in Online Store → Navigation (main-menu + footer).');
  }
}

main().catch((e) => { console.error('\n✗', e.message); process.exit(1); });
