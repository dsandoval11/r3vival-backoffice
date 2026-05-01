"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ProductImagesManager } from "@/components/products/product-images-manager";
import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { fetchProductLookups } from "@/lib/services/reference-data";
import {
  EMPTY_PRODUCT_FORM_VALUES,
  fetchProductById,
  saveProduct,
} from "@/lib/services/products";
import type { ProductFormValues, ProductLookups } from "@/lib/types";

interface ProductFormProps {
  productId?: string;
}

function normalizePriceInput(value: string): string {
  return value.replace(/\D/g, "");
}

function formatPriceInput(value: string): string {
  if (!value) return "";
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(productId);

  const [lookups, setLookups] = useState<ProductLookups | null>(null);
  const [formValues, setFormValues] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM_VALUES);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [lookupRows, productResult] = await Promise.all([
          fetchProductLookups(),
          productId ? fetchProductById(productId) : Promise.resolve(null),
        ]);

        setLookups(lookupRows);
        if (productResult) {
          setFormValues({
            ...productResult.values,
            price: normalizePriceInput(productResult.values.price),
            purchase_price: normalizePriceInput(productResult.values.purchase_price),
          });
          setReferenceCode(productResult.referenceCode);
        } else {
          setFormValues(EMPTY_PRODUCT_FORM_VALUES);
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
  }, [productId]);

  const subcategoryOptions = useMemo(() => {
    if (!lookups) return [];

    return lookups.subcategories.map((subcategory) => ({
      id: subcategory.id,
      label: subcategory.category_name
        ? `${subcategory.category_name} / ${subcategory.name}`
        : subcategory.name,
    }));
  }, [lookups]);

  function updateField<K extends keyof ProductFormValues>(
    field: K,
    value: ProductFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [field]: value }));
  }

  function toggleSize(sizeId: string) {
    setFormValues((current) => {
      const ids = current.size_ids;
      const next = ids.includes(sizeId)
        ? ids.filter((id) => id !== sizeId)
        : [...ids, sizeId];
      return { ...current, size_ids: next };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const savedProductId = await saveProduct(formValues, productId);

      if (isEditMode) {
        setSuccessMessage("Producto guardado.");
      } else {
        router.push(`/products/${savedProductId}/edit`);
      }
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error ? saveError.message : "Error al guardar el producto.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || !lookups) {
    return <p className="text-sm text-zinc-500">Cargando...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? "Editar Producto" : "Crear Producto"}
        description="Gestiona los detalles, relaciones y visibilidad del producto."
      />

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-6 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6"
      >
        {/* Reference code (edit mode only) */}
        {isEditMode && referenceCode ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Referencia:
            </span>
            <span className="rounded bg-zinc-100 px-2 py-1 text-sm font-mono font-medium text-zinc-800">
              {referenceCode}
            </span>
          </div>
        ) : null}

        {/* Main fields grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField htmlFor="name" label="Nombre" required>
            <input
              id="name"
              type="text"
              value={formValues.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              placeholder="Chaqueta Vintage"
            />
          </FormField>

          <FormField htmlFor="price" label="Precio de venta" required>
            <input
              id="price"
              type="text"
              inputMode="numeric"
              value={formatPriceInput(formValues.price)}
              onChange={(event) =>
                updateField("price", normalizePriceInput(event.target.value))
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              placeholder="0"
            />
          </FormField>

          <FormField htmlFor="purchase_price" label="Precio de compra">
            <input
              id="purchase_price"
              type="text"
              inputMode="numeric"
              value={formatPriceInput(formValues.purchase_price)}
              onChange={(event) =>
                updateField("purchase_price", normalizePriceInput(event.target.value))
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              placeholder="0"
            />
          </FormField>

          <FormField htmlFor="brand_id" label="Marca" required>
            <select
              id="brand_id"
              value={formValues.brand_id}
              onChange={(event) => updateField("brand_id", event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Seleccionar marca</option>
              {lookups.brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField htmlFor="subcategory_id" label="Subcategoría" required>
            <select
              id="subcategory_id"
              value={formValues.subcategory_id}
              onChange={(event) => updateField("subcategory_id", event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Seleccionar subcategoría</option>
              {subcategoryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField htmlFor="color_id" label="Color" required>
            <select
              id="color_id"
              value={formValues.color_id}
              onChange={(event) => updateField("color_id", event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Seleccionar color</option>
              {lookups.colors.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField htmlFor="condition_id" label="Condición" required>
            <select
              id="condition_id"
              value={formValues.condition_id}
              onChange={(event) => updateField("condition_id", event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Seleccionar condición</option>
              {lookups.conditions.map((condition) => (
                <option key={condition.id} value={condition.id}>
                  {condition.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField htmlFor="entry_date" label="Fecha de entrada">
            <input
              id="entry_date"
              type="date"
              value={formValues.entry_date}
              onChange={(event) => updateField("entry_date", event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            />
          </FormField>

          <FormField htmlFor="exit_date" label="Fecha de salida">
            <input
              id="exit_date"
              type="date"
              value={formValues.exit_date}
              onChange={(event) => updateField("exit_date", event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            />
          </FormField>

          <FormField htmlFor="measurements" label="Medidas">
            <input
              id="measurements"
              type="text"
              value={formValues.measurements}
              onChange={(event) => updateField("measurements", event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              placeholder="Ej: pecho 90cm, largo 70cm"
            />
          </FormField>
        </div>

        {/* Description */}
        <FormField htmlFor="description" label="Descripción">
          <textarea
            id="description"
            rows={3}
            value={formValues.description}
            onChange={(event) => updateField("description", event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            placeholder="Descripción del producto..."
          />
        </FormField>

        {/* Sizes */}
        {lookups.sizes.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700">Tallas</p>
            <div className="flex flex-wrap gap-2">
              {lookups.sizes.map((size) => {
                const checked = formValues.size_ids.includes(size.id);
                return (
                  <label
                    key={size.id}
                    className={`cursor-pointer select-none rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                      checked
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-300 text-zinc-700 hover:border-zinc-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleSize(size.id)}
                    />
                    {size.name}
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Catalog visibility */}
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={formValues.visibleInCatalog}
              onChange={(event) => updateField("visibleInCatalog", event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            Visible en el catálogo
          </label>
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Guardando..." : "Guardar producto"}
          </button>
          <Link
            href="/products"
            className="w-full rounded-md border border-zinc-300 px-4 py-2 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 sm:w-auto"
          >
            Volver al listado
          </Link>
        </div>
      </form>

      {productId ? <ProductImagesManager productId={productId} /> : null}
    </div>
  );
}
