"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { getSupabaseClient } from "@/lib/supabase/client";

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

interface SidebarProps {
  mobile?: boolean;
}

export function Sidebar({ mobile = false }: SidebarProps) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    try {
      setSigningOut(true);
      setError(null);

      const { error: signOutError } = await getSupabaseClient().auth.signOut();
      if (signOutError) {
        throw new Error(signOutError.message);
      }
    } catch (signOutError) {
      console.error(signOutError);
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "No se pudo cerrar sesión.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  if (mobile) {
    return (
      <div className="space-y-2">
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </button>
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

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
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
