"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/ui/page-header";
import {
  deleteSimpleEntity,
  listSimpleEntities,
  type SimpleEntityTable,
} from "@/lib/services/entities";
import type { NamedEntity } from "@/lib/types";

interface SimpleEntityListPageProps {
  table: SimpleEntityTable;
  title: string;
  createHref: string;
  editBaseHref: string;
}

export function SimpleEntityListPage({
  table,
  title,
  createHref,
  editBaseHref,
}: SimpleEntityListPageProps) {
  const [rows, setRows] = useState<NamedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listSimpleEntities(table);
      setRows(data);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : "Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, [table]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("¿Eliminar este registro?");
    if (!confirmed) return;

    try {
      setError(null);
      await deleteSimpleEntity(table, id);
      await loadRows();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "Error al eliminar.");
    }
  }

  return (
    <div>
      <PageHeader title={title} actionLabel="Nuevo" actionHref={createHref} />

      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
          No se encontraron registros.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <article key={row.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                <p className="text-sm font-medium text-zinc-900">{row.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`${editBaseHref}/${row.id}/edit`}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete(row.id)}
                    className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white md:block">
            <table className="min-w-[420px] divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`${editBaseHref}/${row.id}/edit`}
                          className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDelete(row.id)}
                          className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
