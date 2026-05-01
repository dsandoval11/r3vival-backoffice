import Link from "next/link";
import { useState } from "react";

import type { ProductListItem } from "@/lib/types";

interface ProductsTableProps {
  products: ProductListItem[];
}

function formatPrice(price: number): string {
  return Math.round(price).toLocaleString("es-CO");
}

function parseMeasurements(measurements: string): string[] {
  return measurements
    .split(/\r?\n|,|;/)
    .map((line) => line.replace(/^[-•🔸\s]+/, "").trim())
    .filter(Boolean);
}

function buildProductDescription(product: ProductListItem): string {
  const sizeLabel = product.sizeNames.length > 0 ? product.sizeNames.join(", ") : "No especificada";
  const measurements = parseMeasurements(product.measurements);
  const measurementsSection =
    measurements.length > 0
      ? measurements.map((value) => `🔸 ${value}`).join("\n")
      : "🔸 No registradas";
  const separationPrice = Math.round(product.price * 0.3);

  return `${product.name} ✨DISPONIBLE✨

${product.conditionName}
Talla: ${sizeLabel}
📐 Medidas:
${measurementsSection}

PRECIO: $${formatPrice(product.price)}

*Si estás interesada o necesitas más detalles, ¡Escribenos al interno o comenta la publicacion!
*Puedes separar la prenda abonando el 30% del valor de la misma ($${formatPrice(separationPrice)})
*Ref. ${product.referenceCode}`;
}

export function ProductsTable({ products }: ProductsTableProps) {
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);

  async function handleCopyDescription(product: ProductListItem) {
    try {
      await navigator.clipboard.writeText(buildProductDescription(product));
      setCopiedProductId(product.id);

      window.setTimeout(() => {
        setCopiedProductId((current) => (current === product.id ? null : current));
      }, 2000);
    } catch (copyError) {
      console.error(copyError);
      window.alert("No se pudo copiar la descripción.");
    }
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
        No se encontraron productos.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        {products.map((product) => (
          <article key={product.id} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">{product.name}</p>
                <p className="mt-1 font-mono text-xs text-zinc-500">{product.referenceCode}</p>
              </div>
              <span
                className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                  product.visibleInCatalog
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                {product.visibleInCatalog ? "Visible" : "Oculto"}
              </span>
            </div>

            <div className="mt-3 space-y-1 text-sm text-zinc-600">
              <p>Marca: {product.brandName}</p>
              <p>Subcategoría: {product.subcategoryName}</p>
              <p>Color: {product.colorName}</p>
              <p>Condición: {product.conditionName}</p>
              <p className="font-medium text-zinc-900">Precio: ${formatPrice(product.price)}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/products/${product.id}/edit`}
                className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Editar
              </Link>
              <button
                type="button"
                onClick={() => void handleCopyDescription(product)}
                className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {copiedProductId === product.id ? "Copiado" : "Copiar descripción"}
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white md:block">
        <table className="min-w-[1100px] divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Ref.</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Subcategoría</th>
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">Condición</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Catálogo</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-sm">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-zinc-500">
                  {product.referenceCode}
                </td>
                <td className="px-4 py-3 font-medium text-zinc-900">{product.name}</td>
                <td className="px-4 py-3 text-zinc-700">{product.brandName}</td>
                <td className="px-4 py-3 text-zinc-700">{product.subcategoryName}</td>
                <td className="px-4 py-3 text-zinc-700">{product.colorName}</td>
                <td className="px-4 py-3 text-zinc-700">{product.conditionName}</td>
                <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">
                  ${formatPrice(product.price)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      product.visibleInCatalog
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {product.visibleInCatalog ? "Visible" : "Oculto"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/products/${product.id}/edit`}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleCopyDescription(product)}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      {copiedProductId === product.id ? "Copiado" : "Copiar descripción"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
