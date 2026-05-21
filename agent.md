# agent.md — Shopify Marketplace Connect Store

> Operating guide for anyone (human or AI) working on this store. Read this first.
> It captures **what we're building, how it's structured, and the conventions we follow** so the
> store stays consistent, premium, and market-ready.

---

## 1. Project Overview

We are building a **ready-to-sell, premium Shopify store** for a recruitment/training challenge.
The hiring decision is based **entirely on store quality** — design, creativity, research, and
modern eCommerce understanding. Benchmark references:

- https://www.therabody.com/ (premium wellness tech)
- https://dieselrcorp.ca/
- https://liwacoffee.com/
- https://notiv.in/
- https://freereignfarm.com/

**Niche:** Skincare / Clean Beauty — brand **Aurelle**
**Theme:** custom **Liquid theme** in [`theme/`](theme/) (Dawn-style Online Store 2.0 structure, hand-built)
**Timeline:** 2 days (build day 1, polish + QA + delivery day 2)
**Storefront password:** `Test@123` (development store, password-protected)

> **State of the build:** the full theme, product CSV, and brand imagery exist in this repo and pass
> `pnpm check` (theme-check) with 0 errors. Platform configuration steps live in [`SETUP.md`](SETUP.md).

The store must look **professional, premium, and market-ready** — equal to the references above.

---

## 2. Brand Identity

> Rename freely, but keep the *system* (one heading font, one body font, 60/30/10 color ratio).

| Field | Value |
|---|---|
| **Brand name** | Aurelle Skincare *(placeholder — confirm/rename)* |
| **Tagline** | "Clean science. Visible skin." |
| **Voice** | Warm, knowledgeable, minimal. Science-meets-nature. Confident, never hype-y. |
| **Target customer** | 25–45, skincare-conscious, values clean/effective ingredients, mid-to-premium budget. |
| **Positioning** | Premium clean beauty — efficacious actives, transparent ingredients, elegant minimalism. |

### Color Palette — 60 / 30 / 10 rule

Every section must respect the ratio: **60% primary, 30% secondary, 10% accent.**

| Role | Ratio | Color | Hex | Usage |
|---|---|---|---|---|
| **Primary** | 60% | Warm Ivory / Cream | `#F6F1EA` | Main backgrounds & dominant sections |
| **Secondary** | 30% | Sage | `#9CAF95` | Supporting sections, alt backgrounds, dividers |
| **Accent** | 10% | Terracotta / Clay | `#BD6B4C` | Buttons, CTAs, sale badges, highlights |
| Text / Ink | — | Espresso | `#2B2622` | Body + heading text |
| Muted | — | Stone | `#8C857C` | Captions, secondary text |

Set these in **Theme Settings → Colors** as a color scheme; apply schemes per-section so the ratio holds.

### Typography

- **Headings:** `Fraunces` (elegant serif — premium, editorial feel)
- **Body:** `Jost` or `Inter` (clean, minimal sans)
- One heading font + one body font only. Set in **Theme Settings → Typography**.
- Type scale: keep generous line-height (1.5–1.7 body), large hero headings, clear hierarchy.

---

## 3. Tooling & Environment

- **Platform:** Shopify Partners account → Development Store (no payments / test mode).
- **Theme:** custom Liquid theme in `theme/`. Edit Liquid/CSS/JS directly; further tweaks (content,
  app blocks) happen in the **Theme Editor** after upload.
- **Package manager: pnpm** (team preference). Setup is `pnpm install`. Scripts (`package.json`):
  - `pnpm dev` → `shopify theme dev --path theme` (live preview)
  - `pnpm push` / `pnpm pull` → upload / download theme
  - `pnpm check` → `shopify theme check --path theme` (lint; keep at 0 errors)
  - `pnpm package` → zip theme for manual upload
  - `pnpm gen:images` → regenerate brand imagery (`scripts/gen-images.mjs`, uses `sharp`)
  - Shopify CLI is a devDependency; native build scripts (sharp, esbuild) are approved in
    `pnpm-workspace.yaml` (`allowBuilds`), and `verifyDepsBeforeRun: false` keeps `pnpm run` quiet.
- **Auth:** `pnpm exec shopify login --store <your-dev-store>.myshopify.com`.
- **Version control:** git repo initialized; remote `origin` → `github.com:Dhruva430/shopify_marketplace`.
- **AI assist:** use **Shopify Sidekick / Shopify Magic** for extra section ideas, copy, and SEO — see §9.

---

## 4. Theme Architecture (Online Store 2.0) — as built in `theme/`

A hand-built OS 2.0 theme. Actual layout:

```
theme/
  assets/
    base.css        → entire design system (tokens, components, responsive)
    global.js       → cart drawer + AJAX add, product gallery, variant logic,
                      sticky ATC, mobile nav, quantity steppers (vanilla, no deps)
  config/
    settings_schema.json  → brand colors (60/30/10), layout, cards, cart, social
    settings_data.json    → brand defaults pre-filled (ivory/sage/terracotta)
  layout/
    theme.liquid    → wrapper; injects CSS vars from settings, loads fonts + assets
    password.liquid → standalone branded password page (Test@123)
  locales/en.default.json
  sections/
    header, footer, announcement-bar               (static, rendered in layout)
    hero, featured-collections, featured-products,  (homepage)
    benefits, image-with-text, bundle-promo,
    testimonials, trust-badges, newsletter
    main-product, main-collection, main-cart,       (page mains)
    main-list-collections, main-search, main-404, contact-form, faq, main-page
  snippets/
    product-card, price, rating-stars, badge, icon, cart-drawer, social-icons
  templates/        → JSON templates composing the sections, with content baked in
    index, product, collection, list-collections, cart, search, 404,
    page, page.about, page.contact, page.faq, customers/*
```

### Conventions we follow

- **JSON templates + sections, not hardcoded pages.** Compose pages from sections in the editor.
- **Sections everywhere:** any page can have sections added/reordered via the Theme Editor.
- **App blocks:** apps inject storefront UI via app blocks/embeds — add them in the editor, don't
  hand-code app markup.
- **Metafields for structured product content** (ingredients, how-to-use, key benefits, skin type).
  Bind them into sections via **dynamic sources** so content is reusable and consistent.
- **Color schemes per section** to enforce the 60/30/10 ratio rather than ad-hoc colors.
- **Never edit checkout liquid** (not available on Dawn/standard); use Checkout settings + apps.
- Keep custom code minimal and isolated. Prefer a `custom-liquid` block or a clearly-named custom
  section over editing Dawn's core sections, so theme updates stay clean.

---

## 5. Custom Sections Policy

1. Try the **native Dawn section** first.
2. If missing, use **Shopify Sidekick / Magic** to generate a section, then refine.
3. If hand-coding, create a **new** `sections/custom-*.liquid` with its own `{% schema %}`; don't
   fork Dawn defaults. Match Dawn's CSS class naming and spacing tokens.
4. Document any custom section in §12 (Change Log).

---

## 6. Required Apps (6) — Integration Map

Install via **Apps** in admin. For each: enable widgets, **style to match brand palette/fonts**, and test.

| App | What it does | Where it lives | Integration notes |
|---|---|---|---|
| **Judge.me Reviews** | Product reviews, ratings, UGC photos | Product page (review widget + star rating), homepage carousel | Add review **app blocks** under product info and a reviews carousel section on home. Match accent color for stars. Seed sample reviews. |
| **Shopify Bundles** | Native fixed/multi-variant bundles | Product (bundle) pages, collection | Create a "Complete Routine Kit" bundle (cleanser + serum + moisturizer). Native first-party app. |
| **Shopify Subscriptions** | Subscribe & save / replenishment | Product page (selling-plan selector) | Enable on consumables (serums, cleanser). Offer e.g. 10% off + free shipping on subscribe. |
| **Shopify Search & Discovery** | Smart search, filters, product recommendations | Search results, collection filters, "Complete the routine" recs | Configure synonyms, filters (skin type, concern, ingredient), and recommendation rules. |
| **Shopify Marketplace Connect** | Sync catalog/orders to external marketplaces (Amazon, eBay, Walmart, etc.) | Admin only (channel sync), not storefront | Connect catalog, map categories, sync inventory/orders. This is the namesake of the project — set up and document the sync. |
| **Labeler – Product Labels** | Badges on product cards/pages | Product cards + product page | Labels: "Best Seller", "New", "Vegan", "Sale". Use accent/secondary colors; don't overload cards. |

> **Why these matter together:** Bundles + Subscriptions drive AOV/LTV, Judge.me + Labeler build
> trust and urgency, Search & Discovery improves findability/recommendations, Marketplace Connect
> extends reach to external channels. Study each app's docs and note learnings in §12.

---

## 7. Information Architecture

### Main menu
`Home` · `Shop` (Catalog) · `Collections` (by concern: Hydration, Brightening, Anti-aging, Sun) ·
`Bundles` · `About` · `Contact`

### Footer menu
`About Us` · `FAQ` · `Shipping & Returns` · `Privacy Policy` · `Terms of Service` · `Track Order` (optional) · social links

### Required pages (create as placeholders early, fill on day 2)
About Us · Contact Us · FAQ · Shipping & Returns · Privacy Policy · Terms of Service
*(Use Shopify's free policy generators for legal pages.)*

### Store setup basics
Timezone, currency, store name/niche, password protection ON, dev-store/test mode ON.

---

## 8. Homepage Structure (in order)

A **long, complete** homepage — not short or empty. Sections, top to bottom:

1. **Announcement bar** — offer / free shipping threshold.
2. **Hero banner** — lifestyle image + headline + single primary CTA (accent button).
3. **Featured collections** — by skin concern (Hydration / Brightening / etc.).
4. **Best-selling products** — product grid w/ Labeler badges + Judge.me stars.
5. **Benefits / USP** — icon row (Clean ingredients · Cruelty-free · Dermatologist-tested · etc.).
6. **Product highlight / hero product** — single product spotlight with key actives.
7. **Bundle promo** — "Complete Routine Kit" with savings callout.
8. **Testimonials** — Judge.me reviews carousel.
9. **Brand story** — short founder/science narrative (premium feel).
10. **Trust badges** — payment, guarantee, returns icons.
11. **Newsletter signup** — email capture (+ pop-up via email app).
12. **Footer** — policies + social.

Maintain 60/30/10 color rhythm and consistent vertical spacing between sections.

---

## 9. Content, Copy & SEO Conventions

- **Products (3–5, high quality):** optimized title, benefits-first description, high-res images,
  variants where relevant, price + compare-at price, SKU + inventory, product type / vendor / tags,
  collection mapping, **SEO meta title + meta description**, shipping snippet.
  - Suggested catalog: Hydrating Hyaluronic Serum, Vitamin C Brightening Serum, Gentle Gel Cleanser,
    Barrier Repair Moisturizer, SPF 50 Mineral Sunscreen.
- **Copy voice:** clean, benefit-led, ingredient-transparent. No unverifiable medical claims.
- **AI use (Shopify Magic/Sidekick):** generate/refine section layouts, product descriptions, SEO
  meta, navigation, and any missing sections — then human-edit for brand voice.
- **Imagery:** consistent style, high-res, background-removed product shots + lifestyle shots.

---

## 10. Conversion & UX Conventions

- Sticky add-to-cart (theme-dependent), trust signals, announcement bar, email capture pop-up.
- Discount strategy: % off / fixed / free shipping / BOGO (via apps).
- **Product page:** clean image gallery, clear variant selectors, sticky ATC, trust badges,
  reviews positioned below the fold, bundle/subscription options, "complete the routine" recs.
- **Mobile-first:** verify every page on mobile + desktop. Fix spacing, padding, alignment.
- Test full journey: Home → Product → Cart → Checkout (test mode), incl. upsells, shipping, discounts.

---

## 11. Deliverables (final submission)

- [ ] Partner account access OR collaborator invite
- [ ] Shopify preview link + store password (`Test@123`)
- [ ] Product CSV export
- [ ] Image folders: originals + background-removed
- [ ] All 6 apps installed, styled, and tested
- [ ] All pages complete, no placeholder content, all links working
- [ ] Brand consistency validated; shipping + discount codes verified
- [ ] Store confirmed ready for review

### QA checklist (day 2)
Every page reviewed manually · placeholders removed · links work · palette matches exactly ·
typography consistent · buttons/icons consistent · images optimized · mobile + desktop pass ·
shipping rate shows · discount codes apply.

---

## 12. Change Log & Learnings

Record custom sections, app config decisions, and per-app study notes here as the build progresses.

- **Theme built (v1.0):** full custom Liquid OS 2.0 theme in `theme/` — homepage (10 sections),
  product page (gallery, variant JS, subscription selling-plan UI, sticky ATC, app-block slot,
  reviews target, "pairs well with"), collection (filters + sort + pagination), cart page + AJAX
  drawer with free-shipping bar, search, 404, About/Contact/FAQ, customer account templates.
- **Design system:** `assets/base.css` holds all styling; brand tokens come from theme settings via
  CSS vars in `theme.liquid`. 60/30/10 palette + Fraunces/Jost (Google Fonts).
- **Imagery:** `scripts/gen-images.mjs` (sharp) generates product (3× each), collection, hero,
  story, logo, favicon PNGs into `brand/images/`. Vector mockups — swap for real photos later.
- **App hooks in theme:** product page exposes an `@app` block slot + `#reviews` (Judge.me);
  subscription selector renders from `product.selling_plan_groups`; collection filters read
  `collection.filters` (Search & Discovery); badges read `badge:*` tags (Labeler-style).
- **Tooling:** pnpm + Shopify CLI; `pnpm check` passes with 0 errors (6 warnings = Google Fonts).
- **TODO on platform:** see `SETUP.md` — create store, upload, import CSV + images, build
  nav/collections/pages, install & configure the 6 apps, shipping + discounts, QA.

---

_Last updated: 2026-05-21_
