import { listSimpleEntities, listSubcategories } from "@/lib/services/entities";
import type { ProductLookups } from "@/lib/types";

const CACHE_TTL_MS = 5 * 60_000;
let cache: { data: ProductLookups; expiresAt: number } | null = null;
let inflight: Promise<ProductLookups> | null = null;

async function loadLookups(): Promise<ProductLookups> {
  const [brands, categories, subcategories, colors, conditions, sizes] =
    await Promise.all([
      listSimpleEntities("brands"),
      listSimpleEntities("categories"),
      listSubcategories(),
      listSimpleEntities("colors"),
      listSimpleEntities("conditions"),
      listSimpleEntities("sizes"),
    ]);

  return { brands, categories, subcategories, colors, conditions, sizes };
}

export async function fetchProductLookups(): Promise<ProductLookups> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  if (inflight) return inflight;

  inflight = loadLookups()
    .then((data) => {
      cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function invalidateProductLookups(): void {
  cache = null;
}
