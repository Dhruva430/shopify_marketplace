/**
 * Writes proper policy content to the store's Privacy Policy, Shipping & Returns
 * and Terms of Service pages (matched by handle). Idempotent — re-running just
 * re-applies the canonical content.
 * Run: pnpm pages
 *
 * NOTE: These are solid, general-purpose e-commerce templates tailored to Aurelle.
 * Review them for your jurisdiction (governing law, business address, tax/consumer
 * law) before a real launch — Shopify Settings → Policies can also generate
 * region-aware versions.
 */
import { rest, errMsg, type Page } from './shopify.ts';

const EMAIL = 'support@aurelle.com'; // update to your real support address
const BRAND = 'Aurelle';

const privacy = `
<p><em>Last updated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</em></p>
<p>${BRAND} ("we", "us", "our") respects your privacy. This policy explains what information we collect when you visit or buy from our store, how we use it, and the choices you have.</p>

<h2>Information we collect</h2>
<ul>
  <li><strong>Information you give us:</strong> name, email, shipping and billing address, phone number, and payment details when you place an order or create an account.</li>
  <li><strong>Information collected automatically:</strong> device and browser type, IP address, pages viewed, and how you interact with the store, gathered through cookies and similar technologies.</li>
  <li><strong>Communications:</strong> messages you send us and your marketing preferences.</li>
</ul>

<h2>How we use your information</h2>
<ul>
  <li>To process and deliver your orders and send order updates.</li>
  <li>To provide customer support and respond to your enquiries.</li>
  <li>To improve our products, website and shopping experience.</li>
  <li>To send marketing emails where you have opted in (you can unsubscribe at any time).</li>
  <li>To detect and prevent fraud and to meet our legal obligations.</li>
</ul>

<h2>Cookies</h2>
<p>We use cookies to keep your cart, remember preferences, measure traffic and personalise content. You can control cookies through your browser settings; disabling them may affect site functionality.</p>

<h2>How we share information</h2>
<p>We do not sell your personal information. We share it only with trusted providers who help us run the store, including:</p>
<ul>
  <li>Our e-commerce platform (Shopify) and payment processors to handle orders and payments securely.</li>
  <li>Shipping carriers to deliver your orders.</li>
  <li>Analytics and marketing services that help us understand and improve our store.</li>
  <li>Authorities where required by law.</li>
</ul>

<h2>Data retention</h2>
<p>We keep your information for as long as needed to fulfil the purposes above, including legal, accounting and reporting requirements.</p>

<h2>Your rights</h2>
<p>Depending on where you live, you may have the right to access, correct, delete or port your personal data, and to object to or restrict certain processing (for example under GDPR or CCPA). To exercise these rights, contact us at <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>

<h2>Security</h2>
<p>We use industry-standard safeguards, including encrypted checkout, to protect your information. No method of transmission is 100% secure, but we work hard to keep your data safe.</p>

<h2>Children</h2>
<p>Our store is not intended for children under 16, and we do not knowingly collect their data.</p>

<h2>Changes</h2>
<p>We may update this policy from time to time. The "last updated" date above reflects the latest revision.</p>

<h2>Contact</h2>
<p>Questions about your privacy? Email us at <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
`;

const shipping = `
<h2>Order processing</h2>
<p>Orders are processed within <strong>1–2 business days</strong> (Monday–Friday, excluding holidays). You'll receive a confirmation email when your order is placed and a tracking link once it ships.</p>

<h2>Shipping options &amp; costs</h2>
<ul>
  <li><strong>Free standard shipping</strong> on all orders over <strong>$50</strong>.</li>
  <li><strong>Standard shipping</strong> (under $50): a flat rate is calculated at checkout. Estimated delivery 3–7 business days.</li>
  <li><strong>Express shipping:</strong> available at checkout where eligible. Estimated delivery 1–3 business days.</li>
</ul>

<h2>International shipping</h2>
<p>We ship to selected countries. Delivery times vary by destination. Any customs duties, taxes or import fees are the responsibility of the recipient.</p>

<h2>Order tracking</h2>
<p>Once your order ships, we'll email you a tracking number. Please allow up to 48 hours for tracking to update.</p>

<h2>Returns</h2>
<p>We want you to love your routine. If you're not completely satisfied, you can return your order within <strong>30 days</strong> of delivery for a full refund — <strong>even if the product has been opened and tried</strong>.</p>
<ul>
  <li>Items should be returned with their original packaging where possible.</li>
  <li>For hygiene reasons, heavily used or empty products may be assessed before a refund is issued.</li>
</ul>

<h2>How to start a return</h2>
<p>Email <a href="mailto:${EMAIL}">${EMAIL}</a> with your order number and the items you'd like to return. We'll send you return instructions and a shipping label where applicable.</p>

<h2>Refunds</h2>
<p>Once we receive your return, we'll inspect it and process your refund to the original payment method within <strong>5–10 business days</strong>. Original shipping charges are non-refundable unless the return is due to our error.</p>

<h2>Exchanges</h2>
<p>Want a different product? The fastest way is to return your item for a refund and place a new order.</p>

<h2>Damaged, defective or wrong items</h2>
<p>If your order arrives damaged or you received the wrong item, contact us within <strong>14 days</strong> at <a href="mailto:${EMAIL}">${EMAIL}</a> with a photo and we'll make it right at no cost to you.</p>
`;

const terms = `
<p><em>Last updated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</em></p>
<p>Welcome to ${BRAND}. By accessing or purchasing from this store, you agree to these Terms of Service. Please read them carefully.</p>

<h2>Eligibility</h2>
<p>You must be at least the age of majority in your place of residence, or have the consent of a parent or guardian, to use this store.</p>

<h2>Your account</h2>
<p>If you create an account, you're responsible for keeping your login details secure and for all activity under your account. Let us know immediately of any unauthorised use.</p>

<h2>Products, descriptions &amp; pricing</h2>
<p>We do our best to display our products and colours accurately, but actual appearance may vary by screen. Prices and availability may change without notice. We reserve the right to limit quantities or refuse any order.</p>

<h2>Orders &amp; acceptance</h2>
<p>Your order is an offer to buy. We may accept or decline it, and we may cancel an order if a product is unavailable or a pricing or description error occurs. If we cancel after payment, we'll issue a full refund.</p>

<h2>Payment</h2>
<p>Payment is taken at checkout through our secure payment providers. You confirm you're authorised to use your chosen payment method.</p>

<h2>Shipping, returns &amp; refunds</h2>
<p>Delivery, returns and refunds are governed by our <a href="/pages/shipping-returns">Shipping &amp; Returns</a> policy, which forms part of these Terms.</p>

<h2>Promotions &amp; discount codes</h2>
<p>Offers and discount codes are subject to their stated terms, can't be combined unless noted, and may be withdrawn at any time.</p>

<h2>Cosmetic products &amp; intended use</h2>
<p>Our products are cosmetics for external use only and are not intended to diagnose, treat or cure any condition. We recommend a patch test before first use and consulting a healthcare professional if you have sensitive skin, allergies or a medical concern. Discontinue use if irritation occurs.</p>

<h2>Intellectual property</h2>
<p>All content on this store — including text, images, logos and designs — belongs to ${BRAND} or its licensors and may not be used without permission.</p>

<h2>Acceptable use</h2>
<p>You agree not to misuse the store, attempt to disrupt it, infringe others' rights, or use it for unlawful purposes.</p>

<h2>Reviews &amp; submissions</h2>
<p>Content you submit (such as reviews) must be your own and lawful. By submitting it, you grant us a non-exclusive licence to use it in connection with our store.</p>

<h2>Disclaimer of warranties</h2>
<p>The store and products are provided "as is" to the fullest extent permitted by law, without warranties of any kind except those that cannot be excluded under applicable consumer law.</p>

<h2>Limitation of liability</h2>
<p>To the extent permitted by law, ${BRAND} is not liable for indirect or consequential losses arising from your use of the store. Nothing in these Terms limits rights you have under mandatory consumer protection laws.</p>

<h2>Governing law</h2>
<p>These Terms are governed by the laws of the country in which ${BRAND} is established. Please update this section with your specific jurisdiction before launch.</p>

<h2>Changes</h2>
<p>We may update these Terms from time to time. Continued use of the store means you accept the current version.</p>

<h2>Contact</h2>
<p>Questions about these Terms? Email <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
`;

const pages: Array<{ handle: string; body: string }> = [
  { handle: 'privacy-policy', body: privacy },
  { handle: 'shipping-returns', body: shipping },
  { handle: 'terms-of-service', body: terms },
];

async function main(): Promise<void> {
  console.log('→ Updating policy pages\n');
  for (const p of pages) {
    try {
      const found = (await rest<{ pages: Page[] }>('GET', `/pages.json?handle=${p.handle}&limit=1`)).pages[0];
      if (!found) {
        console.log('  ✗', p.handle, '(page not found — run pnpm seed first)');
        continue;
      }
      await rest('PUT', `/pages/${found.id}.json`, { page: { id: found.id, body_html: p.body.trim() } });
      console.log('  ✓', p.handle, 'updated');
    } catch (e) {
      console.log('  !', p.handle, errMsg(e));
    }
  }
  console.log('\n✓ Done. Review for your jurisdiction before launch.');
}
main().catch((e) => {
  console.error('\n✗', e.message);
  process.exit(1);
});
