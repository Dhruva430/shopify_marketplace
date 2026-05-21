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
import { STORE } from './config.ts';
import {
  rest,
  gql,
  errMsg,
  type Product,
  type ProductImage,
  type SmartCollection,
  type Metafield,
  type UserError,
  type PublicationsQuery,
  type MenusQuery,
} from './shopify.ts';

const b64 = (file: string): string => readFileSync(`brand/images/${file}`).toString('base64');

// Pexels CDN — uniform 4:5 portrait. These IDs are verified live (Shopify fetches them).
const px = (id: number): string =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1500&fit=crop`;
// Verified skincare photo pool (already in use on the store), grouped for reuse by category.
const IMG = {
  serum: 4841353, serumAlt: 4841273, flatlay: 8101520, brighten: 34939744,
  cleanser: 6689393, kit: 5240623, neutral: 3999057,
} as const;

/* ---------- catalogue types ---------- */
interface VariantSeed {
  opt: string;
  sku: string;
  price: string;
  compare: string;
  grams: number;
  qty: number;
}
interface ProductSeed {
  handle: string;
  title: string;
  type: string;
  body: string;
  tags: string[];
  seoTitle: string;
  seoDesc: string;
  variants: VariantSeed[];
  ingredients: string;
  how: string;
  /** Remote image URLs (Pexels) — Shopify fetches these server-side. */
  imageUrls?: string[];
}
interface CollectionSeed {
  handle: string;
  title: string;
  tag: string;
  body: string;
  /** Local brand image filename (base64-attached) … */
  img?: string;
  /** … or a remote tile image URL (Shopify fetches it). */
  imgUrl?: string;
}
interface PageSeed {
  handle: string;
  title: string;
  suffix: string;
  body: string;
}
interface MenuLink {
  title: string;
  url: string;
}

/* ---------- catalogue ---------- */
const P = (h: string): string => `products/${h}`;
const products: ProductSeed[] = [
  {
    handle: 'hydrating-hyaluronic-serum', title: 'Hydrating Hyaluronic Serum', type: 'Serum',
    body: '<p>A weightless daily serum powered by multi-weight <strong>hyaluronic acid</strong> and <strong>5% vitamin B5</strong> to flood skin with moisture and visibly plump in two weeks. Fragrance-free and suitable for sensitive skin.</p><ul><li>Up to 72 hours of hydration</li><li>Plumps fine lines &amp; smooths texture</li><li>Vegan &amp; cruelty-free</li></ul>',
    tags: ['serum', 'badge:Bestseller', 'badge:Vegan', 'skin:Hydration', 'concern:Dryness', 'hydration'],
    seoTitle: 'Hydrating Hyaluronic Serum | Aurelle Skincare',
    seoDesc: 'Weightless hyaluronic acid + B5 serum for up to 72h hydration and visibly plumper skin. Vegan, fragrance-free.',
    variants: [
      { opt: '30ml', sku: 'AUR-HHS-30', price: '32.00', compare: '40.00', grams: 120, qty: 150 },
      { opt: '50ml', sku: 'AUR-HHS-50', price: '44.00', compare: '55.00', grams: 180, qty: 120 },
    ],
    ingredients: 'Sodium Hyaluronate (multi-weight), Panthenol (Pro-Vitamin B5), Glycerin, Aloe Barbadensis Leaf Juice.',
    how: '1. Apply 2–3 drops to clean, damp skin morning and night.\n2. Pat gently until absorbed.\n3. Follow with moisturiser and SPF in the AM.',
  },
  {
    handle: 'vitamin-c-brightening-serum', title: 'Vitamin C Brightening Serum', type: 'Serum',
    body: '<p>A stabilised <strong>15% vitamin C</strong> serum with ferulic acid and vitamin E that visibly brightens, evens tone and defends against daily pollution. Lightweight, fast-absorbing, and non-greasy.</p><ul><li>Fades dark spots &amp; uneven tone</li><li>Antioxidant pollution defence</li><li>Brighter, more radiant skin in 4 weeks</li></ul>',
    tags: ['serum', 'badge:New', 'skin:Brightening', 'concern:Dark spots', 'brightening'],
    seoTitle: 'Vitamin C Brightening Serum | Aurelle Skincare',
    seoDesc: '15% vitamin C + ferulic acid serum to brighten, even tone and defend skin. Visibly radiant in 4 weeks.',
    variants: [{ opt: '30ml', sku: 'AUR-VCS-30', price: '38.00', compare: '48.00', grams: 130, qty: 140 }],
    ingredients: '15% Sodium Ascorbyl Phosphate (Vitamin C), Ferulic Acid, Tocopherol (Vitamin E), Niacinamide.',
    how: '1. Use in the morning on clean skin.\n2. Apply 3–4 drops before moisturiser.\n3. Always follow with SPF.',
  },
  {
    handle: 'gentle-gel-cleanser', title: 'Gentle Gel Cleanser', type: 'Cleanser',
    body: '<p>A pH-balanced gel cleanser with <strong>aloe</strong> and <strong>green tea</strong> that lifts away makeup, SPF and impurities without stripping your barrier. Leaves skin clean, calm and never tight.</p><ul><li>Non-stripping, barrier-friendly</li><li>Removes makeup &amp; SPF</li><li>For all skin types, daily use</li></ul>',
    tags: ['badge:Vegan', 'skin:Hydration', 'concern:Daily care', 'hydration', 'cleanser'],
    seoTitle: 'Gentle Gel Cleanser | Aurelle Skincare',
    seoDesc: 'pH-balanced aloe & green tea gel cleanser that removes makeup and SPF without stripping skin.',
    variants: [{ opt: '150ml', sku: 'AUR-GGC-150', price: '22.00', compare: '', grams: 210, qty: 160 }],
    ingredients: 'Aloe Barbadensis Leaf Juice, Camellia Sinensis (Green Tea) Extract, Coco-Glucoside, Glycerin.',
    how: '1. Massage a small amount onto damp skin morning and night.\n2. Rinse with lukewarm water.\n3. Follow with serum and moisturiser.',
  },
  {
    handle: 'barrier-repair-moisturizer', title: 'Barrier Repair Moisturizer', type: 'Moisturizer',
    body: '<p>A rich-yet-breathable cream with <strong>ceramides</strong>, <strong>niacinamide</strong> and squalane that rebuilds a compromised barrier, locks in moisture and calms redness overnight.</p><ul><li>Strengthens skin barrier</li><li>24-hour moisture lock</li><li>Calms redness &amp; sensitivity</li></ul>',
    tags: ['badge:Bestseller', 'skin:Barrier repair', 'concern:Sensitivity', 'barrier-repair'],
    seoTitle: 'Barrier Repair Moisturizer | Aurelle Skincare',
    seoDesc: 'Ceramide + niacinamide cream that rebuilds the skin barrier, locks in moisture and calms redness.',
    variants: [{ opt: '50ml', sku: 'AUR-BRM-50', price: '36.00', compare: '45.00', grams: 190, qty: 130 }],
    ingredients: 'Ceramide NP, Niacinamide, Squalane, Shea Butter, Glycerin.',
    how: '1. Apply a pea-sized amount as the last step morning and night.\n2. Warm between fingers and press into skin.',
  },
  {
    handle: 'spf-50-mineral-sunscreen', title: 'SPF 50 Mineral Sunscreen', type: 'Sunscreen',
    body: '<p>A weightless <strong>mineral SPF 50</strong> with zinc oxide that shields against UVA/UVB without white cast or grease. Doubles as a smoothing makeup primer for everyday wear.</p><ul><li>Broad-spectrum SPF 50 PA++++</li><li>No white cast, no grease</li><li>Reef-friendly mineral filters</li></ul>',
    tags: ['badge:New', 'badge:Vegan', 'skin:Barrier repair', 'concern:Sun protection', 'barrier-repair'],
    seoTitle: 'SPF 50 Mineral Sunscreen | Aurelle Skincare',
    seoDesc: 'Weightless mineral SPF 50 with zinc oxide — broad-spectrum protection, no white cast. Reef-friendly.',
    variants: [{ opt: '50ml', sku: 'AUR-SPF-50', price: '28.00', compare: '34.00', grams: 170, qty: 150 }],
    ingredients: 'Zinc Oxide 18%, Niacinamide, Glycerin, Tocopherol (Vitamin E).',
    how: '1. Apply as the last step of your morning routine.\n2. Use two finger-lengths for the face and neck.\n3. Reapply every 2 hours of sun exposure.',
  },
  {
    handle: 'the-complete-routine-kit', title: 'The Complete Routine Kit', type: 'Bundle',
    body: '<p>Your full clean routine in one bundle: <strong>Gentle Gel Cleanser</strong>, <strong>Hydrating Hyaluronic Serum</strong> and <strong>Barrier Repair Moisturizer</strong>. Everything your skin needs morning and night — at 20% off buying separately.</p>',
    tags: ['badge:Bestseller', 'bundle', 'value'],
    seoTitle: 'The Complete Routine Kit | Aurelle Skincare',
    seoDesc: 'Cleanser, serum and moisturiser bundle — your full Aurelle routine at 20% off. Clean, vegan, effective.',
    variants: [{ opt: '', sku: 'AUR-KIT-01', price: '89.00', compare: '112.00', grams: 520, qty: 90 }],
    ingredients: 'Includes full-size Gentle Gel Cleanser (150ml), Hydrating Hyaluronic Serum (30ml) and Barrier Repair Moisturizer (50ml).',
    how: 'AM: Cleanse → Serum → Moisturiser → SPF.  PM: Cleanse → Serum → Moisturiser.',
  },

  /* ---------- 20 additional products ---------- */
  {
    handle: 'niacinamide-pore-serum', title: 'Niacinamide 10% + Zinc Pore Serum', type: 'Serum',
    body: '<p>A clarifying serum with <strong>10% niacinamide</strong> and <strong>1% zinc PCA</strong> that visibly minimises pores, balances oil and refines uneven texture without over-drying.</p><ul><li>Visibly smaller-looking pores</li><li>Balances excess oil</li><li>Calms blemish-prone skin</li></ul>',
    tags: ['serum', 'badge:Bestseller', 'skin:Oil control', 'concern:Pores', 'pore-care', 'acne'],
    seoTitle: 'Niacinamide 10% + Zinc Pore Serum | Aurelle', seoDesc: '10% niacinamide + zinc serum that minimises pores, balances oil and refines texture. Vegan, fragrance-free.',
    variants: [{ opt: '', sku: 'AUR-NIA-30', price: '26.00', compare: '32.00', grams: 120, qty: 160 }],
    ingredients: 'Niacinamide 10%, Zinc PCA 1%, Glycerin, Panthenol, Allantoin.',
    how: '1. Apply 3–4 drops morning and night before moisturiser.\n2. Avoid layering with high-strength vitamin C in the same routine.',
    imageUrls: [px(IMG.serum), px(IMG.flatlay)],
  },
  {
    handle: 'retinol-renewal-night-serum', title: 'Retinol Renewal Night Serum', type: 'Serum',
    body: '<p>An encapsulated <strong>0.3% retinol</strong> night serum buffered with squalane and bisabolol to smooth fine lines and renew skin overnight — with less of the usual irritation.</p><ul><li>Smooths fine lines &amp; texture</li><li>Encapsulated for gentle release</li><li>Buffered to reduce irritation</li></ul>',
    tags: ['serum', 'badge:New', 'skin:Anti-aging', 'concern:Fine lines', 'anti-aging'],
    seoTitle: 'Retinol Renewal Night Serum | Aurelle', seoDesc: 'Encapsulated 0.3% retinol night serum that smooths fine lines and renews skin with less irritation.',
    variants: [{ opt: '', sku: 'AUR-RET-30', price: '42.00', compare: '', grams: 120, qty: 110 }],
    ingredients: 'Encapsulated Retinol 0.3%, Squalane, Bisabolol, Tocopherol, Glycerin.',
    how: '1. Use PM only, 2–3 nights a week to start.\n2. Apply to dry skin, then moisturise.\n3. Always wear SPF the next morning.',
    imageUrls: [px(IMG.serumAlt), px(IMG.brighten)],
  },
  {
    handle: 'salicylic-clarifying-serum', title: 'Salicylic Acid 2% Clarifying Serum', type: 'Serum',
    body: '<p>A <strong>2% salicylic acid</strong> (BHA) serum that exfoliates inside the pore to clear blackheads, reduce breakouts and smooth bumpy texture.</p><ul><li>Unclogs &amp; decongests pores</li><li>Reduces breakouts</li><li>Smooths rough texture</li></ul>',
    tags: ['serum', 'skin:Oil control', 'concern:Breakouts', 'acne', 'exfoliating'],
    seoTitle: 'Salicylic Acid 2% Clarifying Serum | Aurelle', seoDesc: '2% BHA serum that clears blackheads, reduces breakouts and smooths texture. For blemish-prone skin.',
    variants: [{ opt: '', sku: 'AUR-SAL-30', price: '28.00', compare: '', grams: 120, qty: 140 }],
    ingredients: 'Salicylic Acid 2%, Zinc PCA, Green Tea Extract, Glycerin, Allantoin.',
    how: '1. Apply at night after cleansing.\n2. Start 3× a week, build to daily as tolerated.\n3. Follow with moisturiser and AM SPF.',
    imageUrls: [px(IMG.brighten), px(IMG.serum)],
  },
  {
    handle: 'peptide-firming-serum', title: 'Peptide Firming Serum', type: 'Serum',
    body: '<p>A multi-peptide serum with <strong>Matrixyl 3000</strong> and copper peptides that visibly firms, plumps and supports skin’s bounce over time.</p><ul><li>Visibly firmer, bouncier skin</li><li>Supports collagen</li><li>Lightweight, layer-friendly</li></ul>',
    tags: ['serum', 'skin:Anti-aging', 'concern:Firmness', 'anti-aging'],
    seoTitle: 'Peptide Firming Serum | Aurelle', seoDesc: 'Multi-peptide serum with Matrixyl 3000 that visibly firms and plumps skin over time. Vegan.',
    variants: [{ opt: '', sku: 'AUR-PEP-30', price: '46.00', compare: '58.00', grams: 120, qty: 100 }],
    ingredients: 'Palmitoyl Tripeptide-1 & Tetrapeptide-7 (Matrixyl 3000), Copper Tripeptide-1, Hyaluronic Acid, Glycerin.',
    how: '1. Apply morning and night before moisturiser.\n2. Pairs well with retinol and vitamin C.',
    imageUrls: [px(IMG.serumAlt), px(IMG.kit)],
  },
  {
    handle: 'squalane-ceramide-facial-oil', title: 'Squalane + Ceramide Facial Oil', type: 'Face Oil',
    body: '<p>A featherlight facial oil of <strong>plant squalane</strong> and <strong>ceramides</strong> that seals in moisture, strengthens the barrier and leaves a healthy, lit-from-within finish.</p><ul><li>Locks in moisture</li><li>Strengthens the barrier</li><li>Non-greasy glow</li></ul>',
    tags: ['oil', 'badge:Vegan', 'skin:Hydration', 'concern:Dryness', 'hydration', 'barrier-repair'],
    seoTitle: 'Squalane + Ceramide Facial Oil | Aurelle', seoDesc: 'Lightweight squalane + ceramide oil that seals in moisture and strengthens the skin barrier. Vegan.',
    variants: [{ opt: '', sku: 'AUR-OIL-30', price: '34.00', compare: '', grams: 130, qty: 120 }],
    ingredients: 'Plant Squalane, Ceramide NP, Jojoba Oil, Tocopherol, Bisabolol.',
    how: '1. Warm 3–4 drops between palms.\n2. Press into skin as the last PM step (or before SPF in AM).',
    imageUrls: [px(IMG.serum), px(IMG.serumAlt)],
  },
  {
    handle: 'rosehip-brightening-oil', title: 'Rosehip Brightening Oil', type: 'Face Oil',
    body: '<p>A cold-pressed <strong>rosehip</strong> oil rich in vitamin A and essential fatty acids that brightens, evens tone and helps fade the look of marks and scars.</p><ul><li>Brightens &amp; evens tone</li><li>Helps fade marks</li><li>Deeply nourishing</li></ul>',
    tags: ['oil', 'skin:Brightening', 'concern:Uneven tone', 'brightening'],
    seoTitle: 'Rosehip Brightening Oil | Aurelle', seoDesc: 'Cold-pressed rosehip oil that brightens, evens tone and helps fade marks. Rich in vitamin A.',
    variants: [{ opt: '', sku: 'AUR-RSH-30', price: '30.00', compare: '', grams: 130, qty: 120 }],
    ingredients: 'Cold-Pressed Rosa Canina (Rosehip) Seed Oil, Sea Buckthorn Extract, Tocopherol.',
    how: '1. Apply 3–4 drops to clean skin morning and/or night.\n2. Layer under moisturiser or mix into it.',
    imageUrls: [px(IMG.brighten), px(IMG.flatlay)],
  },
  {
    handle: 'foaming-cream-cleanser', title: 'Foaming Cream Cleanser', type: 'Cleanser',
    body: '<p>A soft, cushiony foam that melts away the day and rinses clean, leaving skin soft, comfortable and never tight. Powered by glycerin and oat.</p><ul><li>Soft, cushiony lather</li><li>Comfortable, never tight</li><li>For normal-to-dry skin</li></ul>',
    tags: ['cleanser', 'skin:Hydration', 'concern:Daily care', 'hydration'],
    seoTitle: 'Foaming Cream Cleanser | Aurelle', seoDesc: 'Cushiony foaming cream cleanser with glycerin and oat that cleans without stripping. Daily use.',
    variants: [{ opt: '', sku: 'AUR-FCC-150', price: '20.00', compare: '', grams: 200, qty: 150 }],
    ingredients: 'Glycerin, Colloidal Oat, Coco-Glucoside, Panthenol, Allantoin.',
    how: '1. Massage onto damp skin morning and night.\n2. Rinse with lukewarm water.',
    imageUrls: [px(IMG.cleanser), px(IMG.flatlay)],
  },
  {
    handle: 'oil-cleansing-balm', title: 'Melting Oil Cleansing Balm', type: 'Cleanser',
    body: '<p>A silky <strong>cleansing balm</strong> that melts into an oil to dissolve makeup, SPF and sebum, then emulsifies away with water. The perfect first step of a double cleanse.</p><ul><li>Removes makeup &amp; SPF effortlessly</li><li>Emulsifies clean, no residue</li><li>Ideal first cleanse</li></ul>',
    tags: ['cleanser', 'badge:Bestseller', 'skin:Hydration', 'concern:Makeup removal', 'hydration'],
    seoTitle: 'Melting Oil Cleansing Balm | Aurelle', seoDesc: 'Silky cleansing balm that melts away makeup and SPF, then rinses clean. Perfect first cleanse.',
    variants: [{ opt: '', sku: 'AUR-OCB-90', price: '24.00', compare: '', grams: 130, qty: 130 }],
    ingredients: 'Caprylic/Capric Triglyceride, Sunflower Seed Oil, Polyglyceryl Esters, Vitamin E.',
    how: '1. Massage onto dry skin to dissolve makeup.\n2. Add water to emulsify, then rinse.\n3. Follow with a water-based cleanser.',
    imageUrls: [px(IMG.cleanser), px(IMG.kit)],
  },
  {
    handle: 'micellar-cleansing-water', title: 'Micellar Cleansing Water', type: 'Cleanser',
    body: '<p>A no-rinse <strong>micellar water</strong> that gently lifts makeup and grime in one swipe — ideal for mornings, travel and tired nights.</p><ul><li>One-swipe makeup removal</li><li>No-rinse, no residue</li><li>Alcohol-free &amp; gentle</li></ul>',
    tags: ['cleanser', 'skin:Hydration', 'concern:Daily care', 'hydration'],
    seoTitle: 'Micellar Cleansing Water | Aurelle', seoDesc: 'Gentle, alcohol-free micellar water that removes makeup in one swipe. No rinse needed.',
    variants: [{ opt: '', sku: 'AUR-MIC-200', price: '16.00', compare: '', grams: 250, qty: 170 }],
    ingredients: 'Aqua, Poloxamer 184, Glycerin, Panthenol, Chamomile Extract.',
    how: '1. Saturate a cotton pad and sweep over face and eyes.\n2. No rinsing required.',
    imageUrls: [px(IMG.flatlay), px(IMG.cleanser)],
  },
  {
    handle: 'hydrating-essence-toner', title: 'Hydrating Essence Toner', type: 'Toner',
    body: '<p>A watery <strong>essence toner</strong> with polyglutamic acid and beta-glucan that preps and quenches skin, boosting the absorption of everything that follows.</p><ul><li>Instant hydration boost</li><li>Preps skin for serums</li><li>Plump, dewy finish</li></ul>',
    tags: ['toner', 'badge:Vegan', 'skin:Hydration', 'concern:Dryness', 'hydration'],
    seoTitle: 'Hydrating Essence Toner | Aurelle', seoDesc: 'Polyglutamic acid + beta-glucan essence toner that quenches skin and boosts serum absorption.',
    variants: [{ opt: '', sku: 'AUR-ESS-150', price: '24.00', compare: '', grams: 200, qty: 140 }],
    ingredients: 'Polyglutamic Acid, Beta-Glucan, Glycerin, Panthenol, Hyaluronic Acid.',
    how: '1. After cleansing, press 2–3 drops into damp skin.\n2. Follow with serum and moisturiser.',
    imageUrls: [px(IMG.flatlay), px(IMG.serum)],
  },
  {
    handle: 'exfoliating-aha-bha-toner', title: 'Exfoliating AHA/BHA Toner', type: 'Toner',
    body: '<p>A gentle exfoliating tonic with <strong>glycolic, lactic</strong> and <strong>salicylic acids</strong> that resurfaces dull skin for a brighter, smoother, more even complexion.</p><ul><li>Resurfaces dull skin</li><li>Smooths &amp; brightens</li><li>Refines texture</li></ul>',
    tags: ['toner', 'skin:Brightening', 'concern:Dullness', 'exfoliating', 'brightening'],
    seoTitle: 'Exfoliating AHA/BHA Toner | Aurelle', seoDesc: 'Glycolic + lactic + salicylic tonic that resurfaces dull skin for a brighter, smoother complexion.',
    variants: [{ opt: '', sku: 'AUR-AHA-100', price: '27.00', compare: '', grams: 150, qty: 130 }],
    ingredients: 'Glycolic Acid, Lactic Acid, Salicylic Acid, Aloe, Panthenol.',
    how: '1. PM only: sweep over clean skin 2–3 nights a week.\n2. Avoid pairing with retinol the same night.\n3. Always follow with AM SPF.',
    imageUrls: [px(IMG.serum), px(IMG.brighten)],
  },
  {
    handle: 'soothing-rosewater-mist', title: 'Soothing Rosewater Mist', type: 'Toner',
    body: '<p>A fine <strong>rosewater</strong> facial mist with panthenol that refreshes, calms and sets makeup with a soft dewy veil — anytime, anywhere.</p><ul><li>Instant refresh &amp; calm</li><li>Sets makeup</li><li>Hydrating dewy finish</li></ul>',
    tags: ['toner', 'mist', 'skin:Soothing', 'concern:Redness', 'soothing', 'hydration'],
    seoTitle: 'Soothing Rosewater Mist | Aurelle', seoDesc: 'Refreshing rosewater + panthenol mist that calms, hydrates and sets makeup. For all skin types.',
    variants: [{ opt: '', sku: 'AUR-MST-100', price: '18.00', compare: '', grams: 150, qty: 160 }],
    ingredients: 'Rosa Damascena Flower Water, Panthenol, Glycerin, Aloe.',
    how: '1. Mist over face anytime to refresh.\n2. Use before serum or to set makeup.',
    imageUrls: [px(IMG.flatlay), px(IMG.serumAlt)],
  },
  {
    handle: 'overnight-repair-sleeping-mask', title: 'Overnight Repair Sleeping Mask', type: 'Mask',
    body: '<p>A rich <strong>overnight mask</strong> with ceramides, peptides and hyaluronic acid that works while you sleep — wake up to plump, dewy, replenished skin.</p><ul><li>Deep overnight recovery</li><li>Plump, dewy morning skin</li><li>Strengthens the barrier</li></ul>',
    tags: ['mask', 'badge:Bestseller', 'skin:Hydration', 'concern:Dryness', 'hydration', 'barrier-repair'],
    seoTitle: 'Overnight Repair Sleeping Mask | Aurelle', seoDesc: 'Ceramide + peptide overnight mask for plump, dewy, replenished skin by morning.',
    variants: [{ opt: '', sku: 'AUR-SLP-75', price: '32.00', compare: '40.00', grams: 150, qty: 120 }],
    ingredients: 'Ceramide NP, Peptides, Hyaluronic Acid, Squalane, Glycerin.',
    how: '1. Apply a generous layer as the last PM step, 2–3 nights a week.\n2. Rinse in the morning.',
    imageUrls: [px(IMG.kit), px(IMG.serumAlt)],
  },
  {
    handle: 'clay-detox-mask', title: 'Purifying Clay Detox Mask', type: 'Mask',
    body: '<p>A creamy <strong>kaolin &amp; bentonite</strong> clay mask with charcoal that draws out impurities, decongests pores and mattifies — without that tight, parched feeling.</p><ul><li>Draws out impurities</li><li>Decongests pores</li><li>Non-stripping clay</li></ul>',
    tags: ['mask', 'skin:Oil control', 'concern:Pores', 'pore-care', 'acne'],
    seoTitle: 'Purifying Clay Detox Mask | Aurelle', seoDesc: 'Kaolin, bentonite and charcoal mask that draws out impurities and decongests pores without stripping.',
    variants: [{ opt: '', sku: 'AUR-CLY-75', price: '26.00', compare: '', grams: 150, qty: 130 }],
    ingredients: 'Kaolin, Bentonite, Activated Charcoal, Glycerin, Niacinamide.',
    how: '1. Apply an even layer to clean skin, 1–2× a week.\n2. Leave 8–10 minutes, then rinse.\n3. Follow with serum and moisturiser.',
    imageUrls: [px(IMG.kit), px(IMG.cleanser)],
  },
  {
    handle: 'hydrating-sheet-mask-5pack', title: 'Hydrating Sheet Mask (5-Pack)', type: 'Mask',
    body: '<p>Five single-use <strong>biocellulose sheet masks</strong> soaked in a hyaluronic and panthenol serum for an instant hit of hydration and glow.</p><ul><li>Instant plump &amp; glow</li><li>Biodegradable biocellulose</li><li>Five masks per pack</li></ul>',
    tags: ['mask', 'badge:New', 'skin:Hydration', 'concern:Dryness', 'hydration'],
    seoTitle: 'Hydrating Sheet Mask 5-Pack | Aurelle', seoDesc: 'Five biocellulose sheet masks soaked in hyaluronic + panthenol serum for instant hydration and glow.',
    variants: [{ opt: '', sku: 'AUR-SHT-5', price: '22.00', compare: '', grams: 200, qty: 140 }],
    ingredients: 'Hyaluronic Acid, Panthenol, Beta-Glucan, Glycerin (biocellulose sheet).',
    how: '1. Apply to clean skin and relax for 15–20 minutes.\n2. Remove and pat in the remaining essence.',
    imageUrls: [px(IMG.flatlay), px(IMG.kit)],
  },
  {
    handle: 'brightening-eye-cream', title: 'Brightening Eye Cream', type: 'Eye Care',
    body: '<p>A cooling <strong>eye cream</strong> with vitamin C, niacinamide and peptides that brightens dark circles and smooths the look of fine lines around the eyes.</p><ul><li>Brightens dark circles</li><li>Smooths fine lines</li><li>Cooling, de-puffing finish</li></ul>',
    tags: ['eye-care', 'skin:Brightening', 'concern:Dark circles', 'brightening', 'anti-aging'],
    seoTitle: 'Brightening Eye Cream | Aurelle', seoDesc: 'Vitamin C + peptide eye cream that brightens dark circles and smooths fine lines.',
    variants: [{ opt: '', sku: 'AUR-EYE-15', price: '28.00', compare: '', grams: 60, qty: 130 }],
    ingredients: 'Sodium Ascorbyl Phosphate (Vitamin C), Niacinamide, Peptides, Caffeine, Squalane.',
    how: '1. Dab a rice-grain amount around the orbital bone morning and night.\n2. Pat gently until absorbed.',
    imageUrls: [px(IMG.serumAlt), px(IMG.brighten)],
  },
  {
    handle: 'caffeine-eye-serum', title: 'Caffeine Eye Serum', type: 'Eye Care',
    body: '<p>A lightweight roll-on <strong>caffeine</strong> eye serum that de-puffs, energises and smooths tired-looking eyes in seconds.</p><ul><li>De-puffs &amp; energises</li><li>Cooling metal rollerball</li><li>Great over or under makeup</li></ul>',
    tags: ['eye-care', 'badge:New', 'skin:Brightening', 'concern:Puffiness', 'brightening'],
    seoTitle: 'Caffeine Eye Serum | Aurelle', seoDesc: 'Roll-on caffeine eye serum that de-puffs and energises tired-looking eyes in seconds.',
    variants: [{ opt: '', sku: 'AUR-CAF-15', price: '24.00', compare: '', grams: 50, qty: 140 }],
    ingredients: 'Caffeine, Hyaluronic Acid, Peptides, Green Tea, Glycerin.',
    how: '1. Roll under the eyes morning and night.\n2. Pat in gently with your ring finger.',
    imageUrls: [px(IMG.serum), px(IMG.serumAlt)],
  },
  {
    handle: 'lip-repair-treatment-balm', title: 'Lip Repair Treatment Balm', type: 'Lip Care',
    body: '<p>An overnight <strong>lip mask balm</strong> with shea, squalane and ceramides that rescues dry, chapped lips and leaves them soft, smooth and cushiony.</p><ul><li>Rescues chapped lips</li><li>Overnight or daytime use</li><li>Soft, cushiony finish</li></ul>',
    tags: ['lip-care', 'badge:Vegan', 'skin:Hydration', 'concern:Dryness', 'hydration'],
    seoTitle: 'Lip Repair Treatment Balm | Aurelle', seoDesc: 'Shea + squalane + ceramide lip mask balm that rescues dry, chapped lips overnight.',
    variants: [{ opt: '', sku: 'AUR-LIP-15', price: '14.00', compare: '', grams: 40, qty: 180 }],
    ingredients: 'Shea Butter, Squalane, Ceramide NP, Vitamin E, Murumuru Butter.',
    how: '1. Apply a generous layer to lips anytime, or as an overnight mask.',
    imageUrls: [px(IMG.kit), px(IMG.flatlay)],
  },
  {
    handle: 'nourishing-body-lotion', title: 'Nourishing Body Lotion', type: 'Body Care',
    body: '<p>A fast-absorbing <strong>body lotion</strong> with shea butter, niacinamide and oat that drenches skin in 24-hour moisture and leaves a soft, non-greasy finish.</p><ul><li>24-hour body moisture</li><li>Fast-absorbing, non-greasy</li><li>Softens &amp; smooths</li></ul>',
    tags: ['body-care', 'skin:Hydration', 'concern:Dryness', 'hydration'],
    seoTitle: 'Nourishing Body Lotion | Aurelle', seoDesc: 'Shea + niacinamide + oat body lotion for 24-hour moisture and a soft, non-greasy finish.',
    variants: [{ opt: '', sku: 'AUR-BDY-250', price: '22.00', compare: '', grams: 300, qty: 150 }],
    ingredients: 'Shea Butter, Niacinamide, Colloidal Oat, Glycerin, Squalane.',
    how: '1. Massage over the body daily, ideally after showering on damp skin.',
    imageUrls: [px(IMG.serumAlt), px(IMG.neutral)],
  },
  {
    handle: 'exfoliating-body-scrub', title: 'Smoothing Body Scrub', type: 'Body Care',
    body: '<p>A sugar-and-oil <strong>body scrub</strong> with AHAs that buffs away dryness and roughness, leaving skin polished, glowing and soft to the touch.</p><ul><li>Buffs away rough, dry skin</li><li>Sugar + AHA polish</li><li>Nourishing oil base</li></ul>',
    tags: ['body-care', 'skin:Exfoliating', 'concern:Rough skin', 'exfoliating'],
    seoTitle: 'Smoothing Body Scrub | Aurelle', seoDesc: 'Sugar + AHA body scrub that buffs away dryness for polished, glowing, soft skin.',
    variants: [{ opt: '', sku: 'AUR-SCR-200', price: '20.00', compare: '', grams: 280, qty: 150 }],
    ingredients: 'Sucrose (Sugar), Lactic Acid, Sunflower Oil, Shea Butter, Vitamin E.',
    how: '1. Massage onto damp skin in the shower 2–3× a week.\n2. Rinse well.',
    imageUrls: [px(IMG.neutral), px(IMG.kit)],
  },
];

const collections: CollectionSeed[] = [
  { handle: 'hydration', title: 'Hydration', tag: 'hydration', img: 'collection-hydration.png', body: 'Plump, quench and replenish thirsty skin.' },
  { handle: 'brightening', title: 'Brightening', tag: 'brightening', img: 'collection-brightening.png', body: 'Even tone and bring back your natural glow.' },
  { handle: 'barrier-repair', title: 'Barrier Repair', tag: 'barrier-repair', img: 'collection-barrier-repair.png', body: 'Calm, protect and strengthen your skin barrier.' },
  { handle: 'best-sellers', title: 'Best Sellers', tag: 'badge:Bestseller', img: 'collection-hydration.png', body: 'Our most-loved, most-reviewed formulas.' },
  { handle: 'serums', title: 'Serums', tag: 'serum', imgUrl: px(IMG.serum), body: 'Targeted, high-performance actives for every skin goal.' },
  { handle: 'cleansers', title: 'Cleansers', tag: 'cleanser', imgUrl: px(IMG.cleanser), body: 'Gentle, barrier-friendly cleansers for a fresh start.' },
  { handle: 'face-oils', title: 'Face Oils', tag: 'oil', imgUrl: px(IMG.serumAlt), body: 'Nourishing oils that seal in moisture and glow.' },
  { handle: 'toners-mists', title: 'Toners & Mists', tag: 'toner', imgUrl: px(IMG.flatlay), body: 'Hydrate, refresh and prep your skin.' },
  { handle: 'masks', title: 'Masks', tag: 'mask', imgUrl: px(IMG.kit), body: 'Weekly treatments for an instant reset.' },
  { handle: 'eye-care', title: 'Eye Care', tag: 'eye-care', imgUrl: px(IMG.serumAlt), body: 'Brighten, de-puff and smooth the eye area.' },
  { handle: 'anti-aging', title: 'Anti-Aging', tag: 'anti-aging', imgUrl: px(IMG.brighten), body: 'Smooth fine lines and visibly firm skin.' },
  { handle: 'acne-blemish', title: 'Acne & Blemish', tag: 'acne', imgUrl: px(IMG.serum), body: 'Clear, calm and balance blemish-prone skin.' },
  { handle: 'body-care', title: 'Body Care', tag: 'body-care', imgUrl: px(IMG.neutral), body: 'Soften, smooth and nourish from neck to toe.' },
  { handle: 'new-arrivals', title: 'New Arrivals', tag: 'badge:New', imgUrl: px(IMG.flatlay), body: 'The latest additions to the Aurelle ritual.' },
];

const pages: PageSeed[] = [
  { handle: 'about', title: 'About Us', suffix: 'about', body: '<p>Aurelle was born from a simple belief: effective skincare shouldn’t mean a 12-step routine or ingredients you can’t pronounce. We formulate with proven actives, clean standards, and full transparency.</p>' },
  { handle: 'contact', title: 'Contact Us', suffix: 'contact', body: '<p>We’d love to hear from you.</p>' },
  { handle: 'faq', title: 'FAQ', suffix: 'faq', body: '' },
  { handle: 'shipping-returns', title: 'Shipping & Returns', suffix: '', body: '<h2>Shipping</h2><p>Free standard shipping on orders over $50. Most orders ship within 1–2 business days. You’ll receive tracking by email.</p><h2>Returns</h2><p>Not in love? Return within 30 days for a full refund — even if the bottle is open.</p>' },
  { handle: 'privacy-policy', title: 'Privacy Policy', suffix: '', body: '<p>We respect your privacy. We only collect the information needed to process your orders and improve your experience, and we never sell your data. Replace this with your finalised policy (Settings → Policies can generate one).</p>' },
  { handle: 'terms-of-service', title: 'Terms of Service', suffix: '', body: '<p>By using this store you agree to our terms. Replace this with your finalised terms (Settings → Policies can generate one).</p>' },
];

/* ---------- helpers ---------- */
async function getId(listPath: string, key: string, handle: string): Promise<number | null> {
  const data = await rest<Record<string, Array<{ id: number }> | undefined>>('GET', `${listPath}?handle=${handle}&limit=1`);
  const arr = data[key] || [];
  return arr.length ? arr[0].id : null;
}

/**
 * Attaches a product's images, one at a time so a single bad source can't abort
 * the whole seed. Prefers remote URLs (`imageUrls`); falls back to local brand PNGs.
 * Returns the number successfully attached.
 */
async function attachImages(id: number, p: ProductSeed): Promise<number> {
  const sources: Array<{ key: 'src' | 'attachment'; value: string }> = (p.imageUrls?.length
    ? p.imageUrls.map((url) => ({ key: 'src' as const, value: url }))
    : [`${P(p.handle)}-1.png`, `${P(p.handle)}-2.png`, `${P(p.handle)}-3.png`]
        .filter((f) => existsSync(`brand/images/${f}`))
        .map((f) => ({ key: 'attachment' as const, value: b64(f) })));
  let n = 0;
  for (let i = 0; i < sources.length; i++) {
    try {
      await rest('POST', `/products/${id}/images.json`, { image: { [sources[i].key]: sources[i].value, position: i + 1, alt: p.title } });
      n++;
    } catch (e) {
      console.log(`     ! image ${i + 1}:`, errMsg(e));
    }
  }
  return n;
}

async function enrichProduct(id: number, p: ProductSeed): Promise<void> {
  // Ensure all intended tags are present (a CSV import may have used a subset,
  // which leaves smart collections under-populated)
  try {
    const cur = await rest<{ product: Product }>('GET', `/products/${id}.json?fields=id,tags`);
    const have = new Set((cur.product.tags || '').split(',').map((t) => t.trim()).filter(Boolean));
    let changed = false;
    for (const t of p.tags) if (!have.has(t)) { have.add(t); changed = true; }
    if (changed) {
      await rest('PUT', `/products/${id}.json`, { product: { id, tags: [...have].join(', ') } });
      console.log('     ~ tags reconciled');
    }
  } catch (e) {
    console.log('     ! tags:', errMsg(e));
  }
  // Add images if the product has none (CSV imports / fresh products come in without images)
  try {
    const imgs = await rest<{ images: ProductImage[] }>('GET', `/products/${id}/images.json`);
    const count = (imgs.images || []).length;
    if (count === 0) {
      const n = await attachImages(id, p);
      console.log(n ? `     + added ${n} images` : '     · no image source available');
    } else {
      console.log(`     · images already present (${count})`);
    }
  } catch (e) {
    console.log('     ! images:', errMsg(e));
  }
  // Add ingredient / how-to-use metafields if missing
  try {
    const mf = await rest<{ metafields: Metafield[] }>('GET', `/products/${id}/metafields.json?namespace=custom`);
    const have = new Set((mf.metafields || []).map((m) => m.key));
    for (const w of [{ key: 'ingredients', value: p.ingredients }, { key: 'how_to_use', value: p.how }]) {
      if (!have.has(w.key)) {
        await rest('POST', `/products/${id}/metafields.json`, { metafield: { namespace: 'custom', key: w.key, type: 'multi_line_text_field', value: w.value } });
        console.log(`     + metafield custom.${w.key}`);
      }
    }
  } catch (e) {
    console.log('     ! metafields:', errMsg(e));
  }
}

let onlineStorePubId: string | null = null;
async function publish(gidType: string, numericId: number): Promise<void> {
  if (!onlineStorePubId) return;
  const gid = `gid://shopify/${gidType}/${numericId}`;
  try {
    const d = await gql<{ publishablePublish: { userErrors: UserError[] } }>(
      `mutation pub($id:ID!,$pid:ID!){ publishablePublish(id:$id, input:[{publicationId:$pid}]){ userErrors{message} } }`,
      { id: gid, pid: onlineStorePubId },
    );
    const errs = d.publishablePublish.userErrors;
    if (errs.length) console.log('   ! publish:', errs.map((e) => e.message).join('; '));
  } catch {
    /* already published / scope */
  }
}

/* ---------- run ---------- */
async function main(): Promise<void> {
  console.log(`→ Seeding ${STORE}\n`);

  // Find the Online Store publication (for publishing products/collections)
  try {
    const d = await gql<PublicationsQuery>(`{ publications(first:20){ nodes{ id name } } }`);
    const os = d.publications.nodes.find((n) => n.name === 'Online Store');
    onlineStorePubId = os ? os.id : null;
    console.log(onlineStorePubId ? '✓ Online Store channel found\n' : '! Online Store channel not found (products may need manual publish)\n');
  } catch (e) {
    console.log('! Could not query publications:', errMsg(e), '\n');
  }

  // Products
  console.log('Products');
  for (const p of products) {
    const existing = await getId('/products.json', 'products', p.handle);
    if (existing) {
      console.log('  =', p.handle, '(exists) — enriching');
      await enrichProduct(existing, p);
      await publish('Product', existing);
      continue;
    }
    const hasOptions = p.variants.some((v) => v.opt);
    const payload = {
      product: {
        title: p.title, handle: p.handle, body_html: p.body, vendor: 'Aurelle',
        product_type: p.type, tags: p.tags.join(', '), status: 'active',
        options: hasOptions ? [{ name: 'Size' }] : undefined,
        variants: p.variants.map((v) => ({
          option1: v.opt || undefined, sku: v.sku, price: v.price,
          compare_at_price: v.compare || null, grams: v.grams, weight: v.grams / 1000, weight_unit: 'kg',
          inventory_management: 'shopify', inventory_quantity: v.qty, inventory_policy: 'deny',
        })),
        metafields: [
          { namespace: 'custom', key: 'ingredients', type: 'multi_line_text_field', value: p.ingredients },
          { namespace: 'custom', key: 'how_to_use', type: 'multi_line_text_field', value: p.how },
        ],
        metafields_global_title_tag: p.seoTitle,
        metafields_global_description_tag: p.seoDesc,
      },
    };
    const res = await rest<{ product: Product }>('POST', '/products.json', payload);
    // Images are attached separately (one-by-one) so a bad source can't fail the create.
    const imgCount = await attachImages(res.product.id, p);
    console.log('  +', p.handle, `(#${res.product.id}, ${imgCount} images)`);
    await publish('Product', res.product.id);
  }

  // Collections (smart, by tag)
  console.log('\nCollections');
  for (const c of collections) {
    const existing = await getId('/smart_collections.json', 'smart_collections', c.handle);
    if (existing) {
      console.log('  =', c.handle, '(exists, skipped)');
      await publish('Collection', existing);
      continue;
    }
    const image = c.imgUrl ? { src: c.imgUrl, alt: c.title } : c.img ? { attachment: b64(c.img), alt: c.title } : undefined;
    const res = await rest<{ smart_collection: SmartCollection }>('POST', '/smart_collections.json', {
      smart_collection: {
        title: c.title, handle: c.handle, body_html: `<p>${c.body}</p>`, published: true,
        rules: [{ column: 'tag', relation: 'equals', condition: c.tag }],
        image,
      },
    });
    console.log('  +', c.handle, `(#${res.smart_collection.id})`);
    await publish('Collection', res.smart_collection.id);
  }

  // Pages
  console.log('\nPages');
  for (const pg of pages) {
    const existing = await getId('/pages.json', 'pages', pg.handle);
    if (existing) {
      console.log('  =', pg.handle, '(exists, skipped)');
      continue;
    }
    await rest('POST', '/pages.json', {
      page: { title: pg.title, handle: pg.handle, body_html: pg.body, published: true, template_suffix: pg.suffix || null },
    });
    console.log('  +', pg.handle, pg.suffix ? `(template: page.${pg.suffix})` : '(template: default)');
  }

  // Menus
  console.log('\nMenus');
  await seedMenus();

  console.log('\n✓ Done. Open the storefront preview to see it populated.');
}

async function seedMenus(): Promise<void> {
  const main: MenuLink[] = [
    { title: 'Shop', url: '/collections/all' },
    { title: 'Hydration', url: '/collections/hydration' },
    { title: 'Brightening', url: '/collections/brightening' },
    { title: 'Bundles', url: '/products/the-complete-routine-kit' },
    { title: 'About', url: '/pages/about' },
    { title: 'Contact', url: '/pages/contact' },
  ];
  const footer: MenuLink[] = [
    { title: 'About', url: '/pages/about' },
    { title: 'Privacy Policy', url: '/pages/privacy-policy' },
    { title: 'Terms of Service', url: '/pages/terms-of-service' },
  ];
  const help: MenuLink[] = [
    { title: 'FAQ', url: '/pages/faq' },
    { title: 'Shipping & Returns', url: '/pages/shipping-returns' },
    { title: 'Contact', url: '/pages/contact' },
  ];
  const toItems = (arr: MenuLink[]): Array<{ title: string; type: 'HTTP'; url: string }> =>
    arr.map((i) => ({ title: i.title, type: 'HTTP', url: i.url }));
  try {
    const d = await gql<MenusQuery>(`{ menus(first:30){ nodes{ id handle title } } }`);
    const find = (h: string) => d.menus.nodes.find((n) => n.handle === h);
    const menus: Array<[handle: string, title: string, items: MenuLink[]]> = [
      ['main-menu', 'Main menu', main],
      ['footer', 'Footer', footer],
      ['help', 'Help', help],
    ];
    for (const [handle, title, items] of menus) {
      const existing = find(handle);
      if (existing) {
        const r = await gql<{ menuUpdate: { userErrors: UserError[] } }>(
          `mutation u($id:ID!,$t:String!,$h:String!,$i:[MenuItemUpdateInput!]!){ menuUpdate(id:$id,title:$t,handle:$h,items:$i){ userErrors{message} } }`,
          { id: existing.id, t: title, h: handle, i: toItems(items) },
        );
        const e = r.menuUpdate.userErrors;
        console.log(e.length ? `  ! ${handle}: ${e.map((x) => x.message).join('; ')}` : `  ~ ${handle} (updated, ${items.length} links)`);
      } else {
        const r = await gql<{ menuCreate: { userErrors: UserError[] } }>(
          `mutation c($t:String!,$h:String!,$i:[MenuItemCreateInput!]!){ menuCreate(title:$t,handle:$h,items:$i){ userErrors{message} } }`,
          { t: title, h: handle, i: toItems(items) },
        );
        const e = r.menuCreate.userErrors;
        console.log(e.length ? `  ! ${handle}: ${e.map((x) => x.message).join('; ')}` : `  + ${handle} (created, ${items.length} links)`);
      }
    }
  } catch (e) {
    console.log('  ! Menu automation skipped:', errMsg(e));
    console.log('    → Add menus manually in Online Store → Navigation (main-menu + footer).');
  }
}

main().catch((e) => {
  console.error('\n✗', e.message);
  process.exit(1);
});
