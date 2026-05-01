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
        <header className="border-b border-zinc-200 bg-white lg:hidden">
          <div className="px-4 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">R3vival</p>
            <h1 className="text-lg font-semibold">Backoffice</h1>
          </div>
          <div className="px-4 pb-3">
            <Sidebar mobile />
          </div>
        </header>

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
