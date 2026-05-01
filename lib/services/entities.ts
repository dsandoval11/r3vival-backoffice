import { getSupabaseClient } from "@/lib/supabase/client";
import type { Category, Id, NamedEntity, Subcategory } from "@/lib/types";
import { requireId, requireString } from "@/lib/utils/validation";

export type SimpleEntityTable =
  | "brands"
  | "categories"
  | "colors"
  | "conditions"
  | "sizes";

// Tables where the display column is not called "name"
const NAME_COLUMN: Partial<Record<SimpleEntityTable, string>> = {
  sizes: "size",
};

function nameCol(table: SimpleEntityTable): string {
  return NAME_COLUMN[table] ?? "name";
}

async function ensureSimpleNameUnique(
  table: SimpleEntityTable,
  name: string,
  currentId?: Id,
) {
  const supabase = getSupabaseClient();
  const trimmedName = name.trim();
  const col = nameCol(table);

  const { data, error } = await supabase
    .from(table)
    .select("id")
    .ilike(col, trimmedName)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (data.length > 0 && data[0].id !== currentId) {
    throw new Error(`${trimmedName} ya existe.`);
  }
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

  // Normalize to NamedEntity shape
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
  await ensureSimpleNameUnique(table, name);

  const supabase = getSupabaseClient();
  const col = nameCol(table);
  const { error } = await supabase.from(table).insert({ [col]: name.trim() });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateSimpleEntity(
  table: SimpleEntityTable,
  id: Id,
  name: string,
) {
  requireId(id, "Registro");
  requireString(name, "Nombre");
  await ensureSimpleNameUnique(table, name, id);

  const supabase = getSupabaseClient();
  const col = nameCol(table);
  const { error } = await supabase
    .from(table)
    .update({ [col]: name.trim() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteSimpleEntity(table: SimpleEntityTable, id: Id) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

async function ensureSubcategoryNameUnique(
  name: string,
  categoryId: Id,
  currentId?: Id,
) {
  const supabase = getSupabaseClient();
  const trimmedName = name.trim();

  const { data, error } = await supabase
    .from("subcategories")
    .select("id")
    .eq("category_id", categoryId)
    .ilike("name", trimmedName)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (data.length > 0 && data[0].id !== currentId) {
    throw new Error(`${trimmedName} ya existe para la categoría seleccionada.`);
  }
}

export async function listSubcategories() {
  const [subcategories, categories] = await Promise.all([
    (async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("subcategories")
        .select("id,name,category_id")
        .order("name", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data as Subcategory[];
    })(),
    (async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("categories")
        .select("id,name")
        .order("name", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data as Category[];
    })(),
  ]);

  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return subcategories.map((subcategory) => ({
    ...subcategory,
    category_name: categoryById.get(subcategory.category_id)?.name ?? "-",
  }));
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
  await ensureSubcategoryNameUnique(name, categoryId);

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("subcategories").insert({
    name: name.trim(),
    category_id: categoryId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateSubcategory(
  id: Id,
  name: string,
  categoryId: Id,
) {
  requireId(id, "Subcategoría");
  requireString(name, "Nombre");
  requireId(categoryId, "Categoría");
  await ensureSubcategoryNameUnique(name, categoryId, id);

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("subcategories")
    .update({
      name: name.trim(),
      category_id: categoryId,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteSubcategory(id: Id) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("subcategories").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
