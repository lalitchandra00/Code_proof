"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { config } from "../../lib/config";
import { decodeJwtPayload, setToken } from "../../lib/auth";

type LoginResponse = {
  success: boolean;
  accessToken?: string;
  message?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = searchParams.get("next") ?? "/dashboard";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!clientId.trim()) {
      setError("Client ID is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("first")
      const response = await fetch(
        new URL("/api/auth/login", config.apiUrl).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: clientId.trim() }),
        },
      );

      console.log("second")
      console.log(response);

      const rawText = await response.text();
      const data = rawText ? (JSON.parse(rawText) as LoginResponse & { error?: string }) : null;

      if (!response.ok || !data?.accessToken) {
        const message = data?.message ?? data?.error ?? rawText ?? "Login failed. Please try again.";
        setError(message);
        console.error("Login failed", { status: response.status, body: rawText });
        return;
      }

      const payload = decodeJwtPayload(data.accessToken);
      const expires = payload?.exp
        ? new Date(payload.exp * 1000)
        : undefined;

      setToken(data.accessToken, expires ? { expires } : undefined);
      router.replace(nextPath);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            CodeProof
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            Client login
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your clientId to access the security dashboard.
          </p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-700">
            Client ID (UUID)
            <input
              type="text"
              name="clientId"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              placeholder="550e8400-e29b-41d4-a716-446655440000"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
              autoComplete="off"
            />
          </label>
          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
