import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Aurora } from "@/components/Aurora";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — StockSense" },
      {
        name: "description",
        content: "Sign in or create a StockSense account to manage warehouse stock operations.",
      },
      { property: "og:title", content: "Sign in — StockSense" },
      {
        property: "og:description",
        content: "Access your warehouse dashboard, receipts, deliveries and stock ledger.",
      },
    ],
  }),
  component: AuthPage,
});

function safePath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const next = safePath(redirect);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function ensureProfile(fullName?: string) {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email ?? null,
      name: fullName || (user.user_metadata?.["name"] as string | undefined) || "",
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}${next}`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your inbox to confirm your email, then sign in.");
          setMode("signin");
          return;
        }
        await ensureProfile(name);
        navigate({ to: next });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await ensureProfile();
        navigate({ to: next });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    try {
      sessionStorage.setItem("stocksense:next", next);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed. Please try again.");
        return;
      }
      if (result.redirected) return;
      await ensureProfile();
      navigate({ to: next });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12 text-foreground">
      <Aurora />
      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg gradient-brand font-display text-sm font-bold text-primary-foreground">
            S
          </div>
          <span className="font-display text-lg font-semibold">StockSense</span>
        </Link>

        <div className="glass rounded-3xl p-7">
          <h1 className="font-display text-2xl font-semibold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to pick up your warehouse operations."
              : "Set up access for your warehouse team."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            {mode === "signup" ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                autoComplete="name"
                required
                className="w-full rounded-xl border border-input bg-secondary px-4 py-2.5 text-sm outline-none placeholder:text-faint focus:border-ring"
              />
            ) : null}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-input bg-secondary px-4 py-2.5 text-sm outline-none placeholder:text-faint focus:border-ring"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              required
              className="w-full rounded-xl border border-input bg-secondary px-4 py-2.5 text-sm outline-none placeholder:text-faint focus:border-ring"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl gradient-brand px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-brand)] disabled:opacity-60"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={onGoogle}
            disabled={busy}
            className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-medium transition hover:bg-input disabled:opacity-60"
          >
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to StockSense?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-accent"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
