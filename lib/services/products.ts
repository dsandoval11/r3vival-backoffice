import { deleteAllProductImages } from "@/lib/services/product-images";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Id, Product, ProductFormValues, ProductListItem } from "@/lib/types";
import { parsePrice, requireId, requireString } from "@/lib/utils/validation";

export const EMPTY_PRODUCT_FORM_VALUES: ProductFormValues = {
  name: "",
  price: "",
  brand_id: "",
  subcategory_id: "",
  color_id: "",
  condition_id: "",
  visibleInCatalog: false,
  size_ids: [],
  purchase_price: "",
  entry_date: "",
  exit_date: "",
  description: "",
  measurements: "",
  size: "",
};

async function generateReferenceCode(): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("next_reference_code");

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}

export interface ProductFilters {
  search?: string;
  reference?: string;
  name?: string;
  brand_id?: string;
  subcategory_id?: string;
  color_id?: string;
  condition_id?: string;
  catalog?: "visible" | "hidden";
  minPrice?: number | null;
  maxPrice?: number | null;
}

interface NameRef {
  name: string;
}

interface ProductRowWithJoins {
  id: number | string;
  name: string;
  sale_price: number;
  reference_code: string | null;
  measurements: string | null;
  is_visible: boolean;
  brand: NameRef | NameRef[] | null;
  subcategory: NameRef | NameRef[] | null;
  color: NameRef | NameRef[] | null;
  condition: NameRef | NameRef[] | null;
  product_size: Array<{ size: NameRef | NameRef[] | null }> | null;
}

function pickName(value: NameRef | NameRef[] | null | undefined): string {
  if (!value) return "-";
  if (Array.isArray(value)) return value[0]?.name ?? "-";
  return value.name ?? "-";
}

function hasActiveFilters(filters: ProductFilters): boolean {
  return Boolean(
    filters.search ||
      filters.reference ||
      filters.name ||
      filters.brand_id ||
      filters.subcategory_id ||
      filters.color_id ||
      filters.condition_id ||
      filters.catalog ||
      filters.minPrice != null ||
      filters.maxPrice != null,
  );
}

export async function fetchProducts(
  page = 1,
  pageSize = 25,
  filters: ProductFilters = {},
): Promise<{ items: ProductListItem[]; total: number }> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from("products")
    .select(
      `
        id,name,sale_price,reference_code,measurements,is_visible,
        brand:brands(name),
        subcategory:subcategories(name),
        color:colors(name),
        condition:conditions(name),
        product_size(size:sizes(size))
      `,
      { count: hasActiveFilters(filters) ? "exact" : "estimated" },
    )
    .order("reference_code", { ascending: true, nullsFirst: false });

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,reference_code.ilike.%${filters.search}%`,
    );
  }
  if (filters.reference) query = query.ilike("reference_code", `%${filters.reference}%`);
  if (filters.name) query = query.ilike("name", `%${filters.name}%`);
  if (filters.brand_id) query = query.eq("brand_id", filters.brand_id);
  if (filters.subcategory_id) query = query.eq("subcategory_id", filters.subcategory_id);
  if (filters.color_id) query = query.eq("color_id", filters.color_id);
  if (filters.condition_id) query = query.eq("condition_id", filters.condition_id);
  if (filters.minPrice != null) query = query.gte("sale_price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("sale_price", filters.maxPrice);
  if (filters.catalog === "visible") query = query.eq("is_visible", true);
  if (filters.catalog === "hidden") query = query.eq("is_visible", false);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as ProductRowWithJoins[];

  return {
    items: rows.map((row) => {
      const sizeNames = (row.product_size ?? [])
        .map((ps) => {
          const size = Array.isArray(ps.size) ? ps.size[0] : ps.size;
          return size?.name;
        })
        .filter((n): n is string => Boolean(n));

      return {
        id: String(row.id),
        name: row.name,
        price: Number(row.sale_price),
        measurements: row.measurements ?? "",
        sizeNames,
        brandName: pickName(row.brand),
        subcategoryName: pickName(row.subcategory),
        colorName: pickName(row.color),
        conditionName: pickName(row.condition),
        visibleInCatalog: row.is_visible,
        referenceCode: row.reference_code ?? "-",
      } as ProductListItem;
    }),
    total: count ?? 0,
  };
}

export async function fetchProductById(productId: Id): Promise<{
  values: ProductFormValues;
  referenceCode: string | null;
}> {
  requireId(productId, "Producto");

  const supabase = getSupabaseClient();
  const [
    { data: product, error: productError },
    { data: sizeRows, error: sizesError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,name,sale_price,brand_id,subcategory_id,color_id,condition_id,purchase_price,entry_date,exit_date,description,measurements,size,reference_code,is_visible",
      )
      .eq("id", productId)
      .single(),
    supabase.from("product_size").select("size_id").eq("product_id", productId),
  ]);

  if (productError) throw new Error(productError.message);
  if (sizesError) throw new Error(sizesError.message);

  const productRow = product as Product & { is_visible: boolean };

  return {
    values: {
      name: productRow.name,
      price: String(productRow.sale_price),
      brand_id: productRow.brand_id,
      subcategory_id: productRow.subcategory_id,
      color_id: productRow.color_id,
      condition_id: productRow.condition_id,
      visibleInCatalog: productRow.is_visible,
      size_ids: (sizeRows ?? []).map((r: { size_id: string }) => r.size_id),
      purchase_price:
        productRow.purchase_price != null ? String(productRow.purchase_price) : "",
      entry_date: productRow.entry_date ?? "",
      exit_date: productRow.exit_date ?? "",
      description: productRow.description ?? "",
      measurements: productRow.measurements ?? "",
      size: productRow.size ?? "",
    },
    referenceCode: productRow.reference_code ?? null,
  };
}

async function setCatalogVisibility(productId: Id, visibleInCatalog: boolean) {
  const supabase = getSupabaseClient();

  if (visibleInCatalog) {
    const { error: upsertError } = await supabase
      .from("catalog")
      .upsert({ product_id: productId }, { onConflict: "product_id" });

    if (upsertError) throw new Error(upsertError.message);
    return;
  }

  const { error: deleteError } = await supabase
    .from("catalog")
    .delete()
    .eq("product_id", productId);

  if (deleteError) throw new Error(deleteError.message);
}

async function saveProductSizes(productId: Id, sizeIds: Id[]) {
  const supabase = getSupabaseClient();

  const { error: deleteError } = await supabase
    .from("product_size")
    .delete()
    .eq("product_id", productId);

  if (deleteError) throw new Error(deleteError.message);

  if (sizeIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("product_size")
    .insert(sizeIds.map((size_id) => ({ product_id: productId, size_id })));

  if (insertError) throw new Error(insertError.message);
}

export async function saveProduct(values: ProductFormValues, productId?: Id) {
  requireString(values.name, "Nombre");
  requireId(values.brand_id, "Marca");
  requireId(values.subcategory_id, "Subcategoría");
  requireId(values.color_id, "Color");
  requireId(values.condition_id, "Condición");

  const supabase = getSupabaseClient();

  const payload: Record<string, unknown> = {
    name: values.name.trim(),
    sale_price: parsePrice(values.price),
    brand_id: values.brand_id,
    subcategory_id: values.subcategory_id,
    color_id: values.color_id,
    condition_id: values.condition_id,
    purchase_price: values.purchase_price ? Number(values.purchase_price) : null,
    entry_date: values.entry_date || null,
    exit_date: values.exit_date || null,
    description: values.description.trim() || null,
    measurements: values.measurements.trim() || null,
    size: values.size.trim() || null,
  };

  let savedProductId = productId;

  if (productId) {
    const { error } = await supabase.from("products").update(payload).eq("id", productId);

    if (error) throw new Error(error.message);
  } else {
    payload.reference_code = await generateReferenceCode();

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    savedProductId = (data as { id: string }).id;
  }

  if (!savedProductId) throw new Error("No se pudo guardar el producto.");

  await Promise.all([
    setCatalogVisibility(savedProductId, values.visibleInCatalog),
    saveProductSizes(savedProductId, values.size_ids),
  ]);

  return savedProductId;
}

export async function deleteProduct(productId: Id) {
  requireId(productId, "Producto");
  const supabase = getSupabaseClient();

  await deleteAllProductImages(productId);

  const { error: deleteCatalogError } = await supabase
    .from("catalog")
    .delete()
    .eq("product_id", productId);

  if (deleteCatalogError) throw new Error(deleteCatalogError.message);

  const { error: deleteProductError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (deleteProductError) throw new Error(deleteProductError.message);
}
