"use client";

import { useEffect, useRef, useState } from "react";

import { ProductsTable } from "@/components/products/products-table";
import { PageHeader } from "@/components/ui/page-header";
import { fetchProducts, type ProductFilters } from "@/lib/services/products";
import { fetchProductLookups } from "@/lib/services/reference-data";
import type { NamedEntity, ProductListItem } from "@/lib/types";

const PAGE_SIZE = 25;

function parsePriceFilter(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ProductsListPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [referenceFilter, setReferenceFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [brandIdFilter, setBrandIdFilter] = useState("");
  const [subcategoryIdFilter, setSubcategoryIdFilter] = useState("");
  const [colorIdFilter, setColorIdFilter] = useState("");
  const [conditionIdFilter, setConditionIdFilter] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<"all" | "visible" | "hidden">("all");
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");

  const [debouncedTextFilters, setDebouncedTextFilters] = useState({
    search: "",
    reference: "",
    name: "",
    minPrice: "",
    maxPrice: "",
  });

  const [brands, setBrands] = useState<NamedEntity[]>([]);
  const [subcategories, setSubcategories] = useState<NamedEntity[]>([]);
  const [colors, setColors] = useState<NamedEntity[]>([]);
  const [conditions, setConditions] = useState<NamedEntity[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const lookupsLoaded = useRef(false);

  useEffect(() => {
    if (!filtersOpen || lookupsLoaded.current) return;
    lookupsLoaded.current = true;
    setLookupsLoading(true);
    fetchProductLookups()
      .then((lookups) => {
        setBrands(lookups.brands);
        setSubcategories(lookups.subcategories);
        setColors(lookups.colors);
        setConditions(lookups.conditions);
      })
      .catch(console.error)
      .finally(() => setLookupsLoading(false));
  }, [filtersOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTextFilters({
        search,
        reference: referenceFilter,
        name: nameFilter,
        minPrice: minPriceFilter,
        maxPrice: maxPriceFilter,
      });
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, referenceFilter, nameFilter, minPriceFilter, maxPriceFilter]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const filters: ProductFilters = {
          search: debouncedTextFilters.search || undefined,
          reference: debouncedTextFilters.reference || undefined,
          name: debouncedTextFilters.name || undefined,
          brand_id: brandIdFilter || undefined,
          subcategory_id: subcategoryIdFilter || undefined,
          color_id: colorIdFilter || undefined,
          condition_id: conditionIdFilter || undefined,
          catalog: catalogFilter === "all" ? undefined : catalogFilter,
          minPrice: parsePriceFilter(debouncedTextFilters.minPrice),
          maxPrice: parsePriceFilter(debouncedTextFilters.maxPrice),
        };

        const { items, total: fetchedTotal } = await fetchProducts(currentPage, PAGE_SIZE, filters);

        if (!cancelled) {
          setProducts(items);
          setTotal(fetchedTotal);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error(loadError);
          setError(
            loadError instanceof Error ? loadError.message : "Error al cargar los productos.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    debouncedTextFilters,
    brandIdFilter,
    subcategoryIdFilter,
    colorIdFilter,
    conditionIdFilter,
    catalogFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const activeFilterCount = [
    debouncedTextFilters.reference,
    debouncedTextFilters.name,
    brandIdFilter,
    subcategoryIdFilter,
    colorIdFilter,
    conditionIdFilter,
    debouncedTextFilters.minPrice,
    debouncedTextFilters.maxPrice,
    catalogFilter !== "all" ? catalogFilter : "",
  ].filter(Boolean).length;

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

      {loading && products.length === 0 ? (
        <p className="text-sm text-zinc-500">Cargando productos...</p>
      ) : (
        <>
          <section className="mb-4 rounded-lg border border-zinc-200 bg-white">
            <div className="flex items-center gap-3 p-4">
              <input
                id="search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o referencia..."
                className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
                Filtros
                {activeFilterCount > 0 ? (
                  <span className="rounded-full bg-zinc-900 px-1.5 py-0.5 text-xs leading-none text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>

            {filtersOpen ? (
              <div className="border-t border-zinc-100 p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                      value={brandIdFilter}
                      onChange={(event) => {
                        setBrandIdFilter(event.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                    >
                      <option value="">{lookupsLoading ? "Cargando..." : "Todas"}</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
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
                      value={subcategoryIdFilter}
                      onChange={(event) => {
                        setSubcategoryIdFilter(event.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                    >
                      <option value="">{lookupsLoading ? "Cargando..." : "Todas"}</option>
                      {subcategories.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
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
                      value={colorIdFilter}
                      onChange={(event) => {
                        setColorIdFilter(event.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                    >
                      <option value="">{lookupsLoading ? "Cargando..." : "Todos"}</option>
                      {colors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
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
                      value={conditionIdFilter}
                      onChange={(event) => {
                        setConditionIdFilter(event.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                    >
                      <option value="">{lookupsLoading ? "Cargando..." : "Todas"}</option>
                      {conditions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
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
                      onChange={(event) => {
                        setCatalogFilter(event.target.value as "all" | "visible" | "hidden");
                        setCurrentPage(1);
                      }}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                    >
                      <option value="all">Todos</option>
                      <option value="visible">Visible</option>
                      <option value="hidden">Oculto</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <div className="relative">
            {loading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/60">
                <svg
                  className="h-6 w-6 animate-spin text-zinc-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            ) : null}
            <ProductsTable products={products} />
          </div>

          {totalPages > 1 || total > 0 ? (
            <div className="mt-4 flex flex-col gap-3 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Página {currentPage} de {totalPages} &mdash; {total} productos
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
