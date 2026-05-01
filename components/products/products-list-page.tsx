"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";

import { ProductsTable } from "@/components/products/products-table";
import { PageHeader } from "@/components/ui/page-header";
import { fetchProducts } from "@/lib/services/products";
import type { ProductListItem } from "@/lib/types";

const PAGE_SIZE = 25;

export function ProductsListPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await fetchProducts();
      setProducts(rows);
      setCurrentPage(1);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error ? loadError.message : "Error al cargar los productos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const paginated = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Gestiona productos, visibilidad e inventario."
        actionLabel="Nuevo producto"
        actionHref="/products/new"
      />

      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando productos...</p>
      ) : (
        <>
          <ProductsTable products={paginated} />

          {totalPages > 1 ? (
            <div className="mt-4 flex flex-col gap-3 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Página {currentPage} de {totalPages} &mdash; {products.length} productos
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
