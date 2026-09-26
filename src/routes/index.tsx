import { createFileRoute, Link } from "@tanstack/react-router";
import { Aurora } from "@/components/Aurora";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StockSense — Real-time inventory for warehouse teams" },
      {
        name: "description",
        content:
          "Replace spreadsheet stock tracking with receipts, delivery orders and an auditable stock ledger. Live KPIs across every warehouse.",
      },
      { property: "og:title", content: "StockSense — Real-time inventory for warehouse teams" },
      {
        property: "og:description",
        content:
          "Receipts, delivery orders and an append-only stock ledger, with live KPIs across every warehouse.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Aurora />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <nav className="glass flex items-center justify-between rounded-2xl px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg gradient-brand font-display text-sm font-bold text-primary-foreground">
              S
            </div>
            <span className="font-display text-lg font-semibold">StockSense</span>
          </div>
          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <span className="text-foreground">Overview</span>
            <span>Operations</span>
            <span>Ledger</span>
            <span>Warehouses</span>
          </div>
          <Link
            to="/dashboard"
            className="rounded-xl bg-secondary px-4 py-2 text-sm font-medium transition hover:bg-input"
          >
            Open workspace
          </Link>
        </nav>

        <div className="mt-16 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-accent" /> Ledger-backed stock, always
              reconcilable
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] font-bold md:text-6xl">
              Clarity for your <span className="text-gradient-brand">entire</span> warehouse.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              StockSense folds receipts, deliveries and counts into one live surface — so your team
              moves stock with confidence, not spreadsheets.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="rounded-xl gradient-brand px-6 py-3 font-medium text-primary-foreground shadow-[var(--shadow-brand)]"
              >
                Start free
              </Link>
              <Link
                to="/dashboard"
                className="glass rounded-xl px-6 py-3 font-medium transition hover:bg-secondary"
              >
                See the dashboard
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="glass rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Stock moves this week</span>
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                  +18%
                </span>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <div className="flex-1 rounded-t-md bg-secondary" style={{ height: 38 }} />
                <div className="flex-1 rounded-t-md bg-secondary" style={{ height: 52 }} />
                <div className="flex-1 rounded-t-md gradient-brand" style={{ height: 74 }} />
                <div className="flex-1 rounded-t-md bg-secondary" style={{ height: 46 }} />
                <div className="flex-1 rounded-t-md bg-secondary" style={{ height: 60 }} />
                <div className="flex-1 rounded-t-md gradient-brand" style={{ height: 88 }} />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="glass-soft rounded-2xl p-4">
                  <div className="num font-display text-2xl font-semibold">14</div>
                  <div className="mt-1 text-xs text-faint">Tracked SKUs</div>
                </div>
                <div className="glass-soft rounded-2xl p-4">
                  <div className="num font-display text-2xl font-semibold">3</div>
                  <div className="mt-1 text-xs text-faint">Warehouses</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="glass rounded-3xl p-6">
            <div className="grid size-10 place-items-center rounded-xl bg-brand/20 font-display font-bold text-brand">
              R
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">Receipts that add up</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Log a supplier delivery line by line, then validate once — stock rises and the ledger
              records it in the same breath.
            </p>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="grid size-10 place-items-center rounded-xl bg-accent/20 font-display font-bold text-accent">
              D
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">Deliveries that can't dip</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick, pack, validate. Two people validating the same last five units can never push a
              count below zero.
            </p>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/25 font-display font-bold text-foreground">
              L
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">A ledger you can trust</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Every movement is appended, never edited — so counts can always be rebuilt from
              history if they ever drift.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
