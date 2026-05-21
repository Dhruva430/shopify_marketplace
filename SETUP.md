# Aurelle — Shopify Platform Setup Guide

Everything you must configure **inside Shopify** to take this repo from code → a live,
review-ready store. The theme code, product data, and imagery are already in this repo; this
guide is the manual platform work the code can't do for you.

> Brand: **Aurelle** (clean skincare) · Theme: custom Liquid (OS 2.0) · Storefront password: `Test@123`
> Dev store: **fetchwell-edyplil9.myshopify.com** · Admin: https://fetchwell-edyplil9.myshopify.com/admin

---

## 0. What's in this repo (so you know what to upload where)

| Path | What it is | Goes where in Shopify |
|---|---|---|
| `theme/` | The complete Liquid theme | Online Store → Themes (push via CLI or zip) |
| `products.csv` | 6 products (5 + 1 bundle), variants, SEO, tags | Products → Import |
| `brand/images/products/*` | 3 images per product (PNG) | Each product → Media |
| `brand/images/collection-*.png` | Collection tile images | Each collection → Image |
| `brand/images/hero.png`, `brand-story.png` | Homepage section images | Theme editor → section image pickers |
| `brand/images/logo.png` (transparent) | Logo | Theme settings → Logo (and Online Store → Preferences) |
| `brand/images/favicon.png` | Favicon | Theme settings → Favicon |

---

## 1. Account & store (≈1 hr)  — *Day 1 · Step 01*

1. Create a **Shopify Partners** account (fresh email) → https://partners.shopify.com
2. Partners dashboard → **Stores → Add store → Create development store**.
   - Store name: **Aurelle** (or `aurelle-skincare`)
   - Purpose: *Test / build a store*. This keeps it free, no payments needed.
3. **Settings → General**: set timezone, **currency** (e.g. USD), store name, contact email, address.
4. **Online Store → Preferences → Password protection**: turn **ON**, set password to **`Test@123`**.
5. **Settings → Payments**: enable **Bogus Gateway / test mode** (dev stores can place test orders with card `1` repeated, exp future date, any CVC).

---

## 2. Upload the theme (≈15 min)

**Option A — Shopify CLI (recommended, this repo is ready for it):**
```bash
pnpm install                 # already done if you ran setup
pnpm login                   # = shopify login --store fetchwell-edyplil9.myshopify.com
pnpm push                    # = shopify theme push  (uploads to fetchwell-edyplil9)
# or live-preview while editing:
pnpm dev                     # = shopify theme dev
```
`pnpm push` uploads the theme as an **unpublished** theme. Then **Online Store → Themes → Publish**.

**Option B — Zip upload:**
```bash
pnpm package                 # creates theme/aurelle.zip
```
Online Store → Themes → Add theme → **Upload zip** → Publish.

> The theme already ships with brand colors, fonts (Fraunces + Jost), and a fully-built homepage,
> so it looks designed immediately — even before you add products.

---

## 3. Navigation menus (≈10 min)  — *Online Store → Navigation*

**Main menu** (header pulls `main-menu`):
| Label | Link |
|---|---|
| Shop | Collections → All |
| Hydration | Collection → Hydration |
| Brightening | Collection → Brightening |
| Bundles | Product → The Complete Routine Kit |
| About | Page → About |
| Contact | Page → Contact |

**Footer menu** (footer column 1 pulls `footer`):
About · FAQ · Shipping & Returns · Privacy Policy · Terms of Service · Contact

> Create the **Help** menu too (assign it to Footer column 2 in the theme editor): FAQ, Shipping & Returns, Contact, Track order.

---

## 4. Collections (≈10 min)  — *Products → Collections*

Create 4 **automated** collections (condition: *Product tag equals …*). Tags are already in `products.csv`:

| Collection | Handle | Condition (tag) | Tile image |
|---|---|---|---|
| Hydration | `hydration` | `hydration` | `collection-hydration.png` |
| Brightening | `brightening` | `brightening` | `collection-brightening.png` |
| Barrier Repair | `barrier-repair` | `barrier-repair` | `collection-barrier-repair.png` |
| Best Sellers | `best-sellers` | tag `badge:Bestseller` | (any) |

> Handles must match exactly — the homepage and menus reference these handles.

---

## 5. Products & images (≈2 hr)  — *Day 1 · Step 03*

1. **Products → Import** → upload `products.csv`. This creates 6 products (5 skincare + the bundle)
   with titles, rich descriptions, variants, SKUs, prices/compare-at, tags, and SEO fields.
2. For **each** product → **Media**: upload its 3 images from `brand/images/products/`
   (`<handle>-1/-2/-3.png`). Image `-1` is the featured image.
   - e.g. `hydrating-hyaluronic-serum-1.png`, `-2.png`, `-3.png`.
3. (Optional, powers the product page accordions) **Metafields** — create two product metafields,
   namespace **`custom`**, type *Multi-line text* or *Rich text*:
   - `custom.ingredients` — key ingredients list
   - `custom.how_to_use` — application steps
   The product template auto-shows these as accordion sections when filled.
4. Confirm inventory is tracked and quantities look right (set in the CSV).

> Replace the generated vector images with real product photography before a real launch — same
> filenames keep everything wired up.

---

## 6. Core pages (≈20 min)  — *Online Store → Pages*

Create these pages. Templates are already built — assign the **Theme template** in the page sidebar:

| Page | Handle | Template to assign |
|---|---|---|
| About | `about` | `page.about` |
| Contact | `contact` | `page.contact` |
| FAQ | `faq` | `page.faq` |
| Shipping & Returns | `shipping-returns` | `page` (default) |
| Privacy Policy | `privacy-policy` | `page` |
| Terms of Service | `terms-of-service` | `page` |

> For Privacy/Terms/Returns, **Settings → Policies** can auto-generate legal text; or paste into the pages.
> About/Contact/FAQ already have rich, pre-built layouts — just add body copy where relevant.

---

## 7. The 6 apps (≈1.5 hr)  — *Day 1 · Step 04*

Install from the Shopify App Store, then configure. The theme already has placement hooks
(app-block area on the product page, a Judge.me target `#reviews`, subscription selling-plan UI).

### 7.1 Judge.me Reviews
- Install → it auto-adds review widgets. In **Theme editor → Product template**, add the Judge.me
  **app blocks** (Review Widget + Star Rating) into the product info area (the theme exposes an
  `@app` block slot there) and into the `#reviews` section.
- Style stars to the **terracotta** accent `#BD6B4C`. Import a few sample reviews to seed.

### 7.2 Shopify Bundles  (first-party)
- Install **Shopify Bundles** → create a **fixed bundle**: *The Complete Routine Kit* =
  Gentle Gel Cleanser + Hydrating Hyaluronic Serum + Barrier Repair Moisturizer.
- The CSV already includes a `the-complete-routine-kit` product as the landing page; link the
  generated bundle to it (or replace it with the app-generated bundle product).

### 7.3 Shopify Subscriptions  (first-party)
- Install → create a **subscription / selling plan**: "Subscribe & save 10% + free shipping".
- Apply the plan to consumables: serums + cleanser.
- The product page **automatically renders** the "Purchase options" (one-time vs Subscribe & save)
  selector when a product has selling plans — no theme code needed.

### 7.4 Shopify Search & Discovery  (first-party)
- Install → **Filters**: add filters for *Skin concern*, *Type*, *Price*. The collection page
  reads `collection.filters` and renders them automatically.
- **Recommendations**: configure "Complete the routine" / related products. The product page also
  shows a "Pairs well with" grid from the product's collection out of the box.
- Add **synonyms** (e.g. "moisturiser"↔"moisturizer", "vit c"↔"vitamin c").

### 7.5 Shopify Marketplace Connect  (first-party — the project namesake)
- Install → connect an external marketplace (Amazon / eBay / Walmart / Etsy).
- **Link/create** your catalog on the marketplace, **map categories** (Health & Beauty → Skin Care),
  and enable **inventory + order sync**. Document the connected channel + sync status for delivery.
- This is admin-only (no storefront widget) — the value is the multi-channel sync.

### 7.6 Labeler – Product Labels
- Install → create labels: **Bestseller, New, Vegan, Sale**.
- The theme already renders tag-driven badges (`badge:Bestseller`, `badge:New`, `badge:Vegan`, and
  auto "Sale"/"Sold out") on cards and product pages — use Labeler to enrich/animate these or keep
  the built-in badges. Match label colours to the brand palette.

> For every app: enable widgets, **style to the brand**, and test on storefront.

---

## 8. Theme editor polish (≈30 min)  — *Online Store → Themes → Customize*

- **Theme settings → Logo**: upload `brand/images/logo.png`; **Favicon**: `brand/images/favicon.png`.
- **Header section**: confirm Menu = `main-menu`.
- **Footer section**: set column menus + social URLs.
- **Hero section**: upload `brand/images/hero.png`.
- **Image-with-text (story)**: upload `brand/images/brand-story.png`.
- **Featured collections**: confirm the 3 blocks point at hydration / brightening / barrier-repair.
- **Best sellers section**: confirm collection = `best-sellers`.
- **Colors** are pre-set to the 60/30/10 palette; tweak under Theme settings → Brand colors if needed.

---

## 9. Conversion & commerce settings (≈30 min)  — *Day 2*

- **Settings → Shipping**: create a zone with a **Free shipping over $50** rate + a flat rate below it
  (the cart drawer free-shipping bar is set to a $50 / 5000-cent threshold).
- **Discounts**: create `WELCOME10` (10% off first order) and a free-shipping code; test at checkout.
- **Cart**: drawer is enabled by default (Theme settings → Cart). Order notes are on.
- **Announcement bar**: edit the offer text in the theme editor.

---

## 10. QA checklist (≈1.5 hr)  — *Day 2 · Step 10*

- [ ] Home → Product → Cart → Checkout completes in **test mode**
- [ ] Add to cart opens the drawer; free-shipping bar updates; quantities/remove work
- [ ] Variant switching updates price + availability; sticky add-to-cart appears on scroll
- [ ] Subscribe & save selector shows on eligible products; bundle page works
- [ ] Filters + sort work on collections; search returns results
- [ ] Judge.me reviews render; Labeler badges show; recommendations show
- [ ] All 6 pages present, no placeholder text, every menu link works
- [ ] Mobile + desktop both clean (header collapses to burger, grids reflow)
- [ ] Palette matches; shipping rate + discount codes apply correctly
- [ ] Password page (`Test@123`) works

---

## 11. Deliverables package (≈1 hr)  — *Day 2 · Step 11*

- [ ] Partner/collaborator access **or** preview link + password `Test@123`
- [ ] `products.csv`
- [ ] Image folders: `brand/images/` (originals) — these are background-free vector mockups
- [ ] This repo (theme code + setup docs)
- [ ] Store confirmed review-ready

---

## Quick reference — brand system

| Token | Value |
|---|---|
| Primary (60%) ivory | `#F6F1EA` |
| Secondary (30%) cream / sage | `#EFE7DB` / `#9CAF95` |
| Accent (10%) terracotta | `#BD6B4C` |
| Ink (text) | `#2B2622` |
| Headings font | Fraunces (serif) |
| Body font | Jost (sans) |
