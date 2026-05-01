import { deleteAllProductImages } from "@/lib/services/product-images";
import { fetchProductLookups } from "@/lib/services/reference-data";
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
};

async function generateReferenceCode(): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("reference_code")
    .not("reference_code", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  let maxNumber = 0;
  for (const row of data ?? []) {
    const num = parseInt(row.reference_code as string, 10);
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num;
    }
  }

  return String(maxNumber + 1).padStart(4, "0");
}

export async function fetchProducts(limit = 500) {
  const supabase = getSupabaseClient();

  const [productsResult, lookups, catalogResult] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,name,sale_price,brand_id,subcategory_id,color_id,condition_id,reference_code",
      )
      .order("reference_code", { ascending: true, nullsFirst: false })
      .limit(limit),
    fetchProductLookups(),
    supabase.from("catalog").select("product_id"),
  ]);

  if (productsResult.error) {
    throw new Error(productsResult.error.message);
  }

  if (catalogResult.error) {
    throw new Error(catalogResult.error.message);
  }

  const brandNameById = new Map(lookups.brands.map((b) => [b.id, b.name]));
  const subcategoryNameById = new Map(lookups.subcategories.map((s) => [s.id, s.name]));
  const colorNameById = new Map(lookups.colors.map((c) => [c.id, c.name]));
  const conditionNameById = new Map(lookups.conditions.map((c) => [c.id, c.name]));
  const catalogProductIds = new Set(
    (catalogResult.data ?? []).map((r) => r.product_id),
  );

  const products = (productsResult.data ?? []) as Product[];

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.sale_price),
    brandName: brandNameById.get(product.brand_id) ?? "-",
    subcategoryName: subcategoryNameById.get(product.subcategory_id) ?? "-",
    colorName: colorNameById.get(product.color_id) ?? "-",
    conditionName: conditionNameById.get(product.condition_id) ?? "-",
    visibleInCatalog: catalogProductIds.has(product.id),
    referenceCode: product.reference_code ?? "-",
  })) as ProductListItem[];
}

export async function fetchProductById(productId: Id): Promise<{
  values: ProductFormValues;
  referenceCode: string | null;
}> {
  requireId(productId, "Producto");

  const supabase = getSupabaseClient();
  const [
    { data: product, error: productError },
    { data: catalogRows, error: catalogError },
    { data: sizeRows, error: sizesError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,name,sale_price,brand_id,subcategory_id,color_id,condition_id,purchase_price,entry_date,exit_date,description,measurements,reference_code",
      )
      .eq("id", productId)
      .single(),
    supabase.from("catalog").select("product_id").eq("product_id", productId).limit(1),
    supabase.from("product_size").select("size_id").eq("product_id", productId),
  ]);

  if (productError) throw new Error(productError.message);
  if (catalogError) throw new Error(catalogError.message);
  if (sizesError) throw new Error(sizesError.message);

  const productRow = product as Product;

  return {
    values: {
      name: productRow.name,
      price: String(productRow.sale_price),
      brand_id: productRow.brand_id,
      subcategory_id: productRow.subcategory_id,
      color_id: productRow.color_id,
      condition_id: productRow.condition_id,
      visibleInCatalog: (catalogRows ?? []).length > 0,
      size_ids: (sizeRows ?? []).map((r: { size_id: string }) => r.size_id),
      purchase_price:
        productRow.purchase_price != null ? String(productRow.purchase_price) : "",
      entry_date: productRow.entry_date ?? "",
      exit_date: productRow.exit_date ?? "",
      description: productRow.description ?? "",
      measurements: productRow.measurements ?? "",
    },
    referenceCode: productRow.reference_code ?? null,
  };
}

async function setCatalogVisibility(productId: Id, visibleInCatalog: boolean) {
  const supabase = getSupabaseClient();

  if (visibleInCatalog) {
    const { data: existingRows, error: existingError } = await supabase
      .from("catalog")
      .select("product_id")
      .eq("product_id", productId)
      .limit(1);

    if (existingError) throw new Error(existingError.message);

    if ((existingRows ?? []).length === 0) {
      const { error: insertError } = await supabase
        .from("catalog")
        .insert({ product_id: productId });

      if (insertError) throw new Error(insertError.message);
    }

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
