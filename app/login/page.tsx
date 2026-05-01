"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const { error: signInError } = await getSupabaseClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      router.replace("/products");
    } catch (signInError) {
      console.error(signInError);
      setError(signInError instanceof Error ? signInError.message : "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">R3vival</p>
      <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Backoffice</h1>
      <p className="mt-2 text-sm text-zinc-600">Ingresa con tu correo y contraseña.</p>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
            Correo
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu-correo@dominio.com"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Tu contraseña"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>
    </section>
  );
}
