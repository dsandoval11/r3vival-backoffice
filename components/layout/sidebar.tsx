"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/products", label: "Productos" },
  { href: "/brands", label: "Marcas" },
  { href: "/categories", label: "Categorías" },
  { href: "/subcategories", label: "Subcategorías" },
  { href: "/colors", label: "Colores" },
  { href: "/conditions", label: "Condiciones" },
  { href: "/sizes", label: "Tallas" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          R3vival
        </p>
        <h1 className="text-lg font-semibold">Backoffice</h1>
      </div>
      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm transition ${
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
