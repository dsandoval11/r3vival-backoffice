"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import {
  createSubcategory,
  getSubcategoryById,
  listSimpleEntities,
  updateSubcategory,
} from "@/lib/services/entities";
import type { Category } from "@/lib/types";

interface SubcategoryFormPageProps {
  subcategoryId?: string;
}

export function SubcategoryFormPage({ subcategoryId }: SubcategoryFormPageProps) {
  const router = useRouter();
  const isEditMode = Boolean(subcategoryId);

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [categoryRows, currentSubcategory] = await Promise.all([
          listSimpleEntities("categories"),
          subcategoryId ? getSubcategoryById(subcategoryId) : Promise.resolve(null),
        ]);

        setCategories(categoryRows as Category[]);

        if (currentSubcategory) {
          setName(currentSubcategory.name);
          setCategoryId(currentSubcategory.category_id);
        }
      } catch (loadError) {
        console.error(loadError);
        setError(
          loadError instanceof Error ? loadError.message : "Error al cargar el formulario.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [subcategoryId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      if (isEditMode && subcategoryId) {
        await updateSubcategory(subcategoryId, name, categoryId);
      } else {
        await createSubcategory(name, categoryId);
      }

      router.push("/subcategories");
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Cargando...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? "Editar Subcategoría" : "Crear Subcategoría"}
      />

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="max-w-xl space-y-4 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6"
      >
        <FormField htmlFor="name" label="Nombre" required>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            placeholder="Ingresa el nombre de la subcategoría"
          />
        </FormField>

        <FormField htmlFor="category_id" label="Categoría" required>
          <select
            id="category_id"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          >
            <option value="">Seleccionar categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FormField>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <Link
            href="/subcategories"
            className="w-full rounded-md border border-zinc-300 px-4 py-2 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 sm:w-auto"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
