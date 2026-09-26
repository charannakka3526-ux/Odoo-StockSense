import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Aurora } from "@/components/Aurora";

const nav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/stock", label: "Stock" },
  { to: "/receipts", label: "Receipts" },
  { to: "/deliveries", label: "Deliveries" },
  { to: "/ledger", label: "Move ledger" },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Aurora />
      <div className="relative z-10 mx-auto flex max-w-[1400px] gap-6 px-6 py-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-8 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2 px-2">
              <div className="grid size-8 place-items-center rounded-lg gradient-brand font-display text-sm font-bold text-primary-foreground">
                S
              </div>
              <span className="font-display text-lg font-semibold">StockSense</span>
            </Link>

            <nav className="glass rounded-2xl p-2">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "bg-secondary text-foreground font-medium" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="glass rounded-2xl p-4">
              <div className="text-xs text-faint">Signed in</div>
              <div className="mt-1 truncate text-sm">{email || "—"}</div>
              <button
                onClick={signOut}
                className="mt-3 w-full rounded-xl border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="glass flex flex-wrap items-center gap-4 rounded-2xl px-6 py-4">
            <div className="min-w-0">
              <h1 className="font-display text-xl font-semibold">{title}</h1>
              {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            <div className="ml-auto flex items-center gap-2">{actions}</div>
          </header>

          <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="glass shrink-0 rounded-xl px-3 py-1.5 text-sm text-muted-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass overflow-hidden rounded-3xl ${className}`}>
      {title ? (
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <h2 className="font-display text-sm font-semibold">{title}</h2>
          <div className="ml-auto flex items-center gap-2">{right}</div>
        </div>
      ) : null}
      {children}
    </section>
  );
}
