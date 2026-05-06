"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";

import { ProductsTable } from "@/components/products/products-table";
import { PageHeader } from "@/components/ui/page-header";
import { fetchProducts } from "@/lib/services/products";
import type { ProductListItem } from "@/lib/types";

const PAGE_SIZE = 25;

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function parsePriceFilter(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ProductsListPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [referenceFilter, setReferenceFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<"all" | "visible" | "hidden">("all");
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");

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

  const brandOptions = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.brandName))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [products],
  );
  const subcategoryOptions = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.subcategoryName))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [products],
  );
  const colorOptions = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.colorName))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [products],
  );
  const conditionOptions = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.conditionName))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(search);
    const normalizedReference = normalizeText(referenceFilter);
    const normalizedName = normalizeText(nameFilter);
    const minPrice = parsePriceFilter(minPriceFilter);
    const maxPrice = parsePriceFilter(maxPriceFilter);

    return products.filter((product) => {
      if (normalizedSearch) {
        const matchesSearch = [
          product.referenceCode,
          product.name,
          product.brandName,
          product.subcategoryName,
          product.colorName,
          product.conditionName,
          product.visibleInCatalog ? "visible" : "oculto",
          String(Math.round(product.price)),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

        if (!matchesSearch) return false;
      }

      if (
        normalizedReference &&
        !product.referenceCode.toLowerCase().includes(normalizedReference)
      ) {
        return false;
      }

      if (normalizedName && !product.name.toLowerCase().includes(normalizedName)) {
        return false;
      }

      if (brandFilter && product.brandName !== brandFilter) return false;
      if (subcategoryFilter && product.subcategoryName !== subcategoryFilter) return false;
      if (colorFilter && product.colorName !== colorFilter) return false;
      if (conditionFilter && product.conditionName !== conditionFilter) return false;

      if (catalogFilter === "visible" && !product.visibleInCatalog) return false;
      if (catalogFilter === "hidden" && product.visibleInCatalog) return false;

      if (minPrice != null && product.price < minPrice) return false;
      if (maxPrice != null && product.price > maxPrice) return false;

      return true;
    });
  }, [
    brandFilter,
    catalogFilter,
    colorFilter,
    conditionFilter,
    maxPriceFilter,
    minPriceFilter,
    nameFilter,
    products,
    referenceFilter,
    search,
    subcategoryFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    referenceFilter,
    nameFilter,
    brandFilter,
    subcategoryFilter,
    colorFilter,
    conditionFilter,
    catalogFilter,
    minPriceFilter,
    maxPriceFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginated = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

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
          <section className="mb-4 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="md:col-span-2 xl:col-span-3">
                <label htmlFor="search" className="mb-1 block text-xs font-medium text-zinc-600">
                  Buscador general
                </label>
                <input
                  id="search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre, ref, marca, color, condición, precio..."
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-reference"
                  className="mb-1 block text-xs font-medium text-zinc-600"
                >
                  Ref.
                </label>
                <input
                  id="filter-reference"
                  type="text"
                  value={referenceFilter}
                  onChange={(event) => setReferenceFilter(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-name"
                  className="mb-1 block text-xs font-medium text-zinc-600"
                >
                  Nombre
                </label>
                <input
                  id="filter-name"
                  type="text"
                  value={nameFilter}
                  onChange={(event) => setNameFilter(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-brand"
                  className="mb-1 block text-xs font-medium text-zinc-600"
                >
                  Marca
                </label>
                <select
                  id="filter-brand"
                  value={brandFilter}
                  onChange={(event) => setBrandFilter(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                >
                  <option value="">Todas</option>
                  {brandOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filter-subcategory"
                  className="mb-1 block text-xs font-medium text-zinc-600"
                >
                  Subcategoría
                </label>
                <select
                  id="filter-subcategory"
                  value={subcategoryFilter}
                  onChange={(event) => setSubcategoryFilter(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                >
                  <option value="">Todas</option>
                  {subcategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filter-color"
                  className="mb-1 block text-xs font-medium text-zinc-600"
                >
                  Color
                </label>
                <select
                  id="filter-color"
                  value={colorFilter}
                  onChange={(event) => setColorFilter(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                >
                  <option value="">Todos</option>
                  {colorOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filter-condition"
                  className="mb-1 block text-xs font-medium text-zinc-600"
                >
                  Condición
                </label>
                <select
                  id="filter-condition"
                  value={conditionFilter}
                  onChange={(event) => setConditionFilter(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                >
                  <option value="">Todas</option>
                  {conditionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filter-min-price"
                  className="mb-1 block text-xs font-medium text-zinc-600"
                >
                  Precio mínimo
                </label>
                <input
                  id="filter-min-price"
                  type="number"
                  min="0"
                  value={minPriceFilter}
                  onChange={(event) => setMinPriceFilter(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-max-price"
                  className="mb-1 block text-xs font-medium text-zinc-600"
                >
                  Precio máximo
                </label>
                <input
                  id="filter-max-price"
                  type="number"
                  min="0"
                  value={maxPriceFilter}
                  onChange={(event) => setMaxPriceFilter(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-catalog"
                  className="mb-1 block text-xs font-medium text-zinc-600"
                >
                  Catálogo
                </label>
                <select
                  id="filter-catalog"
                  value={catalogFilter}
                  onChange={(event) =>
                    setCatalogFilter(event.target.value as "all" | "visible" | "hidden")
                  }
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                >
                  <option value="all">Todos</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Oculto</option>
                </select>
              </div>
            </div>
          </section>

          <ProductsTable products={paginated} />

          {totalPages > 1 ? (
            <div className="mt-4 flex flex-col gap-3 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Página {currentPage} de {totalPages} &mdash; {filteredProducts.length} productos
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
