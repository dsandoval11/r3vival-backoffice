import Link from "next/link";

import type { ProductListItem } from "@/lib/types";

interface ProductsTableProps {
  products: ProductListItem[];
  onDelete: (productId: string) => Promise<void>;
}

function formatPrice(price: number): string {
  return Math.round(price).toLocaleString("es-CO");
}

export function ProductsTable({ products, onDelete }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
        No se encontraron productos.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
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
              <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                {product.referenceCode}
              </td>
              <td className="px-4 py-3 font-medium text-zinc-900">{product.name}</td>
              <td className="px-4 py-3 text-zinc-700">{product.brandName}</td>
              <td className="px-4 py-3 text-zinc-700">{product.subcategoryName}</td>
              <td className="px-4 py-3 text-zinc-700">{product.colorName}</td>
              <td className="px-4 py-3 text-zinc-700">{product.conditionName}</td>
              <td className="px-4 py-3 text-zinc-700">${formatPrice(product.price)}</td>
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
