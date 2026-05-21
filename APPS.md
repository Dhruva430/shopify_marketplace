# Aurelle — Required Apps: Study & Integration Guide

This document covers the **6 required apps** for the store: what each one does, why
it's used in Aurelle, how to install it, how it integrates with **this theme**
(the exact hooks are already built in), how to configure it, and study notes.

> **Why this is a guide, not a script:** Shopify App Store apps are installed through
> the admin with an **OAuth permission grant** that a logged-in user must approve.
> There is no API/CLI path to install or authorise an app on a store's behalf — so the
> "Install" click is always manual. Everything *around* it (theme hooks, catalogue
> tags/metafields, bundle product) is already prepared, so each app is plug-and-play
> after install.

**Store:** `fetchwell-edyplil9.myshopify.com` (Shopify Partner development store)
**Install entry point for all apps:** Admin → **Apps** → **Shopify App Store** → search the app → **Add app** → **Install**.

## Install order (recommended)

| # | App | Type | Effort | Needs external account? |
|---|-----|------|--------|--------------------------|
| 1 | Shopify Search & Discovery | 1st-party (free) | Low | No |
| 2 | Judge.me Product Reviews | 3rd-party (freemium) | Low | App account (email) |
| 3 | Labeler – Product Labels | 3rd-party | Low | No |
| 4 | Shopify Bundles | 1st-party (free) | Medium | No |
| 5 | Shopify Subscriptions | 1st-party (free) | Medium | No |
| 6 | Shopify Marketplace Connect | 1st-party (free + fees) | High | Yes — marketplace seller account |

After installing each, tell me and I'll **verify it against the live store** (channels, selling plan groups, review metafields, etc.).

---

## 1. Judge.me Product Reviews

**What it is.** A reviews & ratings app: star ratings, written/photo/video reviews,
automated review-request emails, Q&A, and SEO rich snippets (AggregateRating).

**Why for Aurelle.** Skincare is trust-driven — verified reviews and star ratings are
the single biggest conversion lever for a beauty store.

**Install.** App Store → *Judge.me Product Reviews* → Install → create/connect a Judge.me account.

**Integrate with this theme (already wired):**
- Product page has a reviews section: `theme/sections/main-product.liquid` →
  `<section id="reviews">` containing `<div id="judgeme_product_reviews" data-id="{{ product.id }}">`.
  Judge.me auto-detects this widget ID and injects reviews — no code needed.
- The product section also exposes an **`@app` block slot** (`{% when '@app' %}{% render block %}`)
  and a `#reviews` jump link next to the star rating.
- **Theme editor steps:** Online Store → Themes → **Customize** → *Product* template →
  **Add block → Judge.me Review Widget** (drops into the `@app` slot) → also enable
  **App embeds → Judge.me** for the floating widgets, and add the **Judge.me Preview Badge**
  (stars) near the title. Product cards already call `rating-stars`; enable Judge.me's
  **star-rating widget** to populate them.

**Configure.** Brand the widget colours (ivory/sage/terracotta), turn on **review-request
emails**, enable **rich snippets** (SEO), and optionally import seed reviews.

**Study notes.** Social proof & conversion; review *collection* via post-purchase email
automation; **structured data** (`AggregateRating`/`Review`) for Google star snippets;
photo/video reviews; UGC moderation; syndication across products.

**Verify.** Product page renders the Judge.me widget (not the placeholder text); a
`cdn.judge.me` script loads; stars show on cards.

---

## 2. Shopify Bundles

**What it is.** Shopify's first-party app to build **fixed bundles** (several products sold
as one) and **multipacks**, with real component **inventory tracking**.

**Why for Aurelle.** Turns "The Complete Routine Kit" from a standalone product into a
*true* bundle of Cleanser + Serum + Moisturizer, so component stock stays in sync and the
20%-off routine is a real offer.

**Install.** App Store → *Shopify Bundles* (by Shopify) → Install.

**Integrate with this theme (already wired):**
- The homepage **`bundle-promo`** section showcases the kit (`theme/sections/bundle-promo.liquid`,
  configured in `templates/index.json` → `"product":"the-complete-routine-kit"`).
- Create the bundle in the app and either point the promo at the new bundle product or
  re-use the existing `the-complete-routine-kit` handle.

**Steps.** Bundles app → **Create bundle** → add component variants (Gentle Gel Cleanser,
Hydrating Hyaluronic Serum, Barrier Repair Moisturizer) → set bundle price ($89) → add image
→ **publish to Online Store**.

**Configure.** Bundle discount vs buying separately, bundle imagery, availability.

**Study notes.** Fixed bundle vs multipack; **component inventory decrement**; bundles can't
also be subscriptions; max components; how the app's bundle product (`product.bundle`) differs
from a manually-built "kit" product.

**Verify.** Bundle product exists with linked components; a test purchase decrements each
component's inventory.

---

## 3. Shopify Subscriptions

**What it is.** First-party recurring-orders app built on **selling plans / selling plan
groups** and subscription contracts, with a customer self-service portal.

**Why for Aurelle.** Consumables (serums, cleanser, SPF, moisturizer) are perfect for
"Subscribe & Save" — it drives retention and lifetime value.

**Install.** App Store → *Shopify Subscriptions* (by Shopify) → Install.

**Integrate with this theme (already wired):**
- `theme/sections/main-product.liquid` already renders `product.selling_plan_groups`:
  a **one-time vs subscribe selector**, per-plan options, a hidden `selling_plan` input, and
  JS that updates price when a plan is chosen. Once you attach plans to a product, the
  selector **appears automatically** — no theme work needed.

**Steps.** Subscriptions app → **Create subscription plan** (e.g., *Subscribe & Save 15%*,
delivery every **30 / 60 days**) → apply to eligible products (the four single serums/cleanser/SPF)
→ save.

**Configure.** Discount %, delivery frequencies, eligible products, customer portal, emails.

**Study notes.** The selling-plan data model (group → plan → allocation); **subscription
contracts**; billing/dunning & failed payments; customer portal (skip/pause/cancel); churn metrics.

**Verify.** `sellingPlanGroups` is non-empty on the store (I can re-check); product page shows
the subscribe option; add-to-cart carries a `selling_plan` id.

---

## 4. Shopify Search & Discovery

**What it is.** First-party app to enhance **storefront search**, **collection filters**
(facets), **product recommendations**, **synonyms**, and result **boosts**.

**Why for Aurelle.** With 26 products across 14 collections, shoppers need to filter by
concern/skin-type/price and get "complete the routine" recommendations.

**Install.** App Store → *Shopify Search & Discovery* (by Shopify) → Install.

**Integrate with this theme (already wired):**
- `theme/sections/main-collection.liquid` loops `collection.filters` → any filters you enable
  in the app render automatically as facets on collection pages.
- `theme/sections/main-product.liquid` has a **"Complete the routine"** recommendations section
  (Search & Discovery product recommendations).

**Steps.** App → **Filters**: enable Availability, Price, Product type, and tag/metafield
facets matching our tags (`skin:*`, `concern:*`). **Recommendations**: enable *complementary*
+ *related*. **Synonyms**: add e.g. `moisturiser`↔`moisturizer`, `vit c`↔`vitamin c`, `spf`↔`sunscreen`.

**Configure.** Filters, search boosts, recommendation types, synonyms.

**Study notes.** Faceted filtering & the Storefront Filtering API; **complementary vs related**
recommendations; search analytics (top searches / no-results); boosting & synonyms.

**Verify.** Collection pages show a filter sidebar; search returns relevant results; the
product recommendations row populates.

---

## 5. Shopify Marketplace Connect

**What it is.** First-party app (formerly Codisto) to **list and sell on Amazon, eBay,
Walmart and Etsy** from Shopify, syncing catalog, inventory and orders centrally. This is the
"marketplace" core of the brief.

**Why for Aurelle.** Demonstrates true **multichannel** selling — one catalog, multiple
marketplaces, centralized orders.

**Install.** App Store → *Shopify Marketplace Connect* (by Shopify) → Install.

**Integrate.** Link a **marketplace seller account** (Amazon Seller / eBay — a sandbox/test
account is fine for the challenge), **map** Aurelle products to listings (category + attributes),
set channel pricing/inventory rules, and sync. Each linked marketplace appears as a **sales
channel** (visible under Settings → Sales channels and in the publications list).

**Configure.** Account linking, category/attribute mapping, price & inventory rules, order sync.

**Study notes.** Multichannel architecture; listing mapping & marketplace category taxonomies;
inventory/order **sync** and conflict handling; marketplace **fees & policies**. ⚠️ This is the
most involved app because it needs an external seller account.

**Verify.** A marketplace channel shows under Sales channels (currently only Online Store / Shop /
POS / ChatGPT exist — I confirmed this live); products map and list.

---

## 6. Labeler – Product Labels

**What it is.** A merchandising app that overlays **graphical labels/badges** on product
images (Sale, New, Bestseller, Vegan, Limited) driven by **rules**, with scheduling.

**Why for Aurelle.** Eye-catching image labels highlight bestsellers, new launches and vegan
formulas across collection grids and product pages.

**Install.** App Store → *Labeler ‑ Product Labels* → Install.

**Integrate with this theme (already prepared):**
- Products are already tagged `badge:Bestseller`, `badge:New`, `badge:Vegan`, and the theme draws
  **text badges** from these (`theme/snippets/badge.liquid`) plus an automatic *Sale* badge from
  compare-at price.
- Configure Labeler rules to key off the **same tags** so labels are consistent. Labeler adds
  *image-overlay* labels (complementary to our text badges). To avoid duplication you can turn
  the theme's text badges off via the theme setting (`show_badges`) and let Labeler own labels.

**Steps.** Labeler → create labels (brand colours) → rules: tag `badge:Bestseller` → "Bestseller"
label; `badge:New` → "New"; `badge:Vegan` → "Vegan"; compare-at price → "Sale".

**Configure.** Label designs, placement, scheduling (promo windows), rules by tag/collection/price.

**Study notes.** Rule-based merchandising; label **scheduling** for sales; CSS-overlay performance;
avoiding visual clutter (one or two labels max per card).

**Verify.** Labels render on storefront product cards and product pages.

---

## After installing — I can verify for you

Once each app is installed/configured, I can re-run live checks against the store:
- **Marketplace Connect** → new sales channels appear in the publications list
- **Subscriptions** → `sellingPlanGroups` becomes non-empty
- **Judge.me / Labeler** → app metafields/widgets present
- **Bundles** → bundle product with components
- **Search & Discovery** → filters returned on collection pages

Just say the word after you've installed them and I'll confirm what's live.
