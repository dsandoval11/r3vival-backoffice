import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="hidden min-h-screen w-64 border-r border-zinc-200 bg-white p-4 lg:block">
          <Sidebar />
        </aside>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
