import { listSimpleEntities, listSubcategories } from "@/lib/services/entities";
import type { ProductLookups } from "@/lib/types";

export async function fetchProductLookups(): Promise<ProductLookups> {
  const [brands, categories, subcategories, colors, conditions, sizes] =
    await Promise.all([
      listSimpleEntities("brands"),
      listSimpleEntities("categories"),
      listSubcategories(),
      listSimpleEntities("colors"),
      listSimpleEntities("conditions"),
      listSimpleEntities("sizes"),
    ]);

  return {
    brands,
    categories,
    subcategories,
    colors,
    conditions,
    sizes,
  };
}
