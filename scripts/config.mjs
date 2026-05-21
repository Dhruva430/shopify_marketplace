/**
 * Validated configuration for the Shopify Admin API scripts.
 * Loads .env (no external loader) and validates credentials with zod, so a bad
 * or missing token fails fast with a clear message instead of a cryptic 401.
 */
import { readFileSync, existsSync } from 'node:fs';
import { z } from 'zod';

// --- load .env into process.env (does not override already-set vars) ---
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

// --- schema ---
const ConfigSchema = z.object({
  SHOPIFY_STORE: z
    .string({ message: 'SHOPIFY_STORE is required' })
    .min(1, 'SHOPIFY_STORE is required')
    .transform((s) => s.replace(/^https?:\/\//, '').replace(/\/+$/, '').trim())
    .refine((s) => /^[a-z0-9-]+\.myshopify\.com$/i.test(s), 'SHOPIFY_STORE must be a *.myshopify.com domain'),
  SHOPIFY_ADMIN_TOKEN: z
    .string({ message: 'SHOPIFY_ADMIN_TOKEN is required' })
    .min(1, 'SHOPIFY_ADMIN_TOKEN is required')
    .refine((t) => t.startsWith('shpat_'), 'SHOPIFY_ADMIN_TOKEN must be an Admin API access token (starts with "shpat_")'),
  SHOPIFY_API_VERSION: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'SHOPIFY_API_VERSION must look like 2024-10')
    .default('2024-10')
});

const result = ConfigSchema.safeParse(process.env);
if (!result.success) {
  console.error('\n✗ Invalid Shopify credentials.\n');
  for (const issue of result.error.issues) console.error(`  • ${issue.path.join('.') || 'config'}: ${issue.message}`);
  console.error('\nCreate a .env file in the project root:\n  SHOPIFY_STORE=your-store.myshopify.com\n  SHOPIFY_ADMIN_TOKEN=shpat_xxxxxxxxxxxxxxxx\n');
  process.exit(1);
}

const env = result.data;

export const STORE = env.SHOPIFY_STORE;
export const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
export const API_VERSION = env.SHOPIFY_API_VERSION;
export const BASE = `https://${STORE}/admin/api/${API_VERSION}`;
export const HEADERS = {
  'X-Shopify-Access-Token': TOKEN,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

export const config = { store: STORE, token: TOKEN, apiVersion: API_VERSION, base: BASE, headers: HEADERS };
export default config;
