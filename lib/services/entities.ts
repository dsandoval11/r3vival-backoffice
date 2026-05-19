import { invalidateProductLookups } from "@/lib/services/reference-data";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Category, Id, NamedEntity, Subcategory } from "@/lib/types";
import { requireId, requireString } from "@/lib/utils/validation";

export type SimpleEntityTable =
  | "brands"
  | "categories"
  | "colors"
  | "conditions"
  | "sizes";

const NAME_COLUMN: Partial<Record<SimpleEntityTable, string>> = {
  sizes: "size",
};

function nameCol(table: SimpleEntityTable): string {
  return NAME_COLUMN[table] ?? "name";
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export async function listSimpleEntities(table: SimpleEntityTable) {
  const supabase = getSupabaseClient();
  const col = nameCol(table);
  const selectStr = col === "name" ? "id,name" : `id,${col}`;

  const { data, error } = await supabase
    .from(table)
    .select(selectStr)
    .order(col, { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as Record<string, string>[]).map((row) => ({
    id: row.id,
    name: row[col] ?? row.name,
  })) as NamedEntity[];
}

export async function getSimpleEntityById(table: SimpleEntityTable, id: Id) {
  const supabase = getSupabaseClient();
  const col = nameCol(table);
  const selectStr = col === "name" ? "id,name" : `id,${col}`;

  const { data, error } = await supabase
    .from(table)
    .select(selectStr)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as unknown as Record<string, string>;
  return { id: row.id, name: row[col] ?? row.name } as NamedEntity;
}

export async function createSimpleEntity(table: SimpleEntityTable, name: string) {
  requireString(name, "Nombre");

  const supabase = getSupabaseClient();
  const col = nameCol(table);
  const { error } = await supabase.from(table).insert({ [col]: name.trim() });

  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error(`${name.trim()} ya existe.`);
    }
    throw new Error(error.message);
  }

  invalidateProductLookups();
}

export async function updateSimpleEntity(
  table: SimpleEntityTable,
  id: Id,
  name: string,
) {
  requireId(id, "Registro");
  requireString(name, "Nombre");

  const supabase = getSupabaseClient();
  const col = nameCol(table);
  const { error } = await supabase
    .from(table)
    .update({ [col]: name.trim() })
    .eq("id", id);

  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error(`${name.trim()} ya existe.`);
    }
    throw new Error(error.message);
  }

  invalidateProductLookups();
}

export async function deleteSimpleEntity(table: SimpleEntityTable, id: Id) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  invalidateProductLookups();
}

export async function listSubcategories() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("subcategories")
    .select("id,name,category_id,category:categories(name)")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  type Row = Subcategory & { category: { name: string } | { name: string }[] | null };

  return (data as unknown as Row[]).map((row) => {
    const category = Array.isArray(row.category) ? row.category[0] : row.category;
    return {
      id: row.id,
      name: row.name,
      category_id: row.category_id,
      category_name: category?.name ?? "-",
    } as Subcategory;
  });
}

export async function getSubcategoryById(id: Id) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("subcategories")
    .select("id,name,category_id")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Subcategory;
}

export async function createSubcategory(name: string, categoryId: Id) {
  requireString(name, "Nombre");
  requireId(categoryId, "Categoría");

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("subcategories").insert({
    name: name.trim(),
    category_id: categoryId,
  });

  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error(`${name.trim()} ya existe para la categoría seleccionada.`);
    }
    throw new Error(error.message);
  }

  invalidateProductLookups();
}

export async function updateSubcategory(
  id: Id,
  name: string,
  categoryId: Id,
) {
  requireId(id, "Subcategoría");
  requireString(name, "Nombre");
  requireId(categoryId, "Categoría");

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("subcategories")
    .update({
      name: name.trim(),
      category_id: categoryId,
    })
    .eq("id", id);

  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error(`${name.trim()} ya existe para la categoría seleccionada.`);
    }
    throw new Error(error.message);
  }

  invalidateProductLookups();
}

export async function deleteSubcategory(id: Id) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("subcategories").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  invalidateProductLookups();
}

// Kept for backwards compatibility — Category type currently only uses category names from cache.
export type { Category };
