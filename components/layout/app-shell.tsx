"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Sidebar } from "@/components/layout/sidebar";
import { getSupabaseClient } from "@/lib/supabase/client";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseClient();

    function applySessionState(session: unknown) {
      const hasSession = Boolean(session);
      if (!mounted) return;

      setIsAuthenticated(hasSession);
      setAuthChecked(true);

      if (hasSession && isLoginPage) {
        router.replace("/products");
      }

      if (!hasSession && !isLoginPage) {
        router.replace("/login");
      }
    }

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          applySessionState(null);
          return;
        }

        applySessionState(data.session);
      })
      .catch((error: unknown) => {
        console.error(error);
        applySessionState(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySessionState(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isLoginPage, router]);

  if (isLoginPage) {
    if (authChecked && isAuthenticated) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 text-sm text-zinc-500">
          Redirigiendo...
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900">
        <main className="mx-auto w-full max-w-md">{children}</main>
      </div>
    );
  }

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 text-sm text-zinc-500">
        Verificando sesión...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">R3vival</p>
            <h1 className="text-lg font-semibold leading-tight">Backoffice</h1>
          </div>
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Abrir menú"
            className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
        </header>

        {navOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setNavOpen(false)}
          />
        ) : null}

        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white p-4 shadow-xl transition-transform duration-200 ease-in-out lg:hidden ${
            navOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">R3vival</p>
              <p className="text-lg font-semibold">Backoffice</p>
            </div>
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              aria-label="Cerrar menú"
              className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <Sidebar />
        </div>

        <div className="flex">
          <aside className="hidden min-h-screen w-64 border-r border-zinc-200 bg-white p-4 lg:block">
            <Sidebar />
          </aside>
          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
