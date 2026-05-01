"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import {
  createSimpleEntity,
  getSimpleEntityById,
  type SimpleEntityTable,
  updateSimpleEntity,
} from "@/lib/services/entities";

interface SimpleEntityFormPageProps {
  table: SimpleEntityTable;
  title: string;
  backHref: string;
  entityId?: string;
}

export function SimpleEntityFormPage({
  table,
  title,
  backHref,
  entityId,
}: SimpleEntityFormPageProps) {
  const router = useRouter();
  const isEditMode = Boolean(entityId);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentEntityId = entityId;

    if (!currentEntityId) return;

    async function loadEntity(currentId: string) {
      try {
        setLoading(true);
        setError(null);
        const row = await getSimpleEntityById(table, currentId);
        setName(row.name);
      } catch (loadError) {
        console.error(loadError);
        setError(
          loadError instanceof Error ? loadError.message : "Error al cargar el registro.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadEntity(currentEntityId);
  }, [entityId, table]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      if (isEditMode && entityId) {
        await updateSimpleEntity(table, entityId, name);
      } else {
        await createSimpleEntity(table, name);
      }

      router.push(backHref);
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
      <PageHeader title={title} />

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="max-w-xl space-y-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <FormField htmlFor="name" label="Nombre" required>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            placeholder="Ingresa un nombre"
          />
        </FormField>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <Link
            href={backHref}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
