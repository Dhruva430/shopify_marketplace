/**
 * Thin, typed Shopify Admin API client shared by the seed/image scripts.
 * Centralises the REST 429 back-off, the GraphQL helper and the response types
 * so each script stays focused on the data it manages.
 */
import { BASE, HEADERS } from './config.ts';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Best-effort message extraction from an unknown thrown value. */
export const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/** Admin REST call: retries on 429 and self-throttles to ~2 req/s. */
export async function rest<T = unknown>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: HEADERS,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429) {
      await sleep(2000);
      continue;
    }
    const text = await res.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = text;
    }
    if (!res.ok) {
      const errors = typeof json === 'object' && json !== null ? (json as { errors?: unknown }).errors : undefined;
      const detail = typeof json === 'string' ? json : JSON.stringify(errors ?? json);
      throw new Error(`${method} ${path} → ${res.status}: ${detail}`);
    }
    await sleep(550);
    return json as T;
  }
  throw new Error(`${method} ${path} → repeated 429s`);
}

interface GraphQLResponse<T> {
  data: T;
  errors?: unknown;
}

/** Admin GraphQL call. Throws on top-level GraphQL errors. */
export async function gql<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}/graphql.json`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query, variables }),
  });
  const j = (await res.json()) as GraphQLResponse<T>;
  if (j.errors) throw new Error('GraphQL: ' + JSON.stringify(j.errors));
  await sleep(550);
  return j.data;
}

/* ---------- Admin REST resource types (only the fields we use) ---------- */
export interface ProductImage {
  id: number;
  product_id?: number;
  src?: string;
  position?: number;
  alt?: string | null;
}
export interface ProductVariant {
  id: number;
  sku?: string;
  price?: string;
  option1?: string | null;
}
export interface Product {
  id: number;
  handle: string;
  title: string;
  tags: string;
  images: ProductImage[];
  variants?: ProductVariant[];
}
export interface SmartCollection {
  id: number;
  handle: string;
  title: string;
}
export interface Page {
  id: number;
  handle: string;
  title: string;
}
export interface Metafield {
  id: number;
  namespace: string;
  key: string;
  value: string;
  type: string;
}

/* ---------- GraphQL shapes ---------- */
export interface UserError {
  message: string;
}
export interface PublicationsQuery {
  publications: { nodes: Array<{ id: string; name: string }> };
}
export interface MenusQuery {
  menus: { nodes: Array<{ id: string; handle: string; title: string }> };
}
