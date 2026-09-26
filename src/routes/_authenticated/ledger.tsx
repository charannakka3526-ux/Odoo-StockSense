import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { fetchLedger, fetchWarehouses, formatDateTime } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/ledger")({
  component: LedgerPage,
});

const types = ["receipt", "delivery", "transfer", "adjustment"] as const;

function LedgerPage() {
  const ledger = useQuery({ queryKey: ["ledger"], queryFn: fetchLedger });
  const warehouses = useQuery({ queryKey: ["warehouses"], queryFn: fetchWarehouses });

  const [type, setType] = useState("all");
  const [warehouse, setWarehouse] = useState("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (ledger.data ?? [])
      .filter((r) => (type === "all" ? true : r.type === type))
      .filter((r) => (warehouse === "all" ? true : r.locations?.warehouse_id === warehouse))
      .filter((r) =>
        term
          ? `${r.products?.sku ?? ""} ${r.ref_label ?? ""}`.toLowerCase().includes(term)
          : true,
      );
  }, [ledger.data, type, warehouse, search]);

  const inputCls =
    "rounded-xl border border-input bg-secondary px-3 py-1.5 text-sm outline-none placeholder:text-faint focus:border-ring";

  return (
    <AppShell
      title="Move ledger"
      subtitle="Append-only history of every stock movement. Entries are never edited or removed."
    >
      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
          <input
            placeholder="Search SKU or document…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} w-56`}
          />
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            <option value="all">All movement types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            className={inputCls}
          >
            <option value="all">All warehouses</option>
            {(warehouses.data ?? []).map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} · {w.name}
              </option>
            ))}
          </select>
          <span className="num ml-auto text-xs text-faint">{rows.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs tracking-[0.1em] text-faint uppercase">
                <th className="px-5 py-3 text-left font-medium">When</th>
                <th className="px-3 py-3 text-left font-medium">Type</th>
                <th className="px-3 py-3 text-left font-medium">SKU</th>
                <th className="px-3 py-3 text-left font-medium">Product</th>
                <th className="px-3 py-3 text-left font-medium">Location</th>
                <th className="px-3 py-3 text-left font-medium">Document</th>
                <th className="px-5 py-3 text-right font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="num px-5 py-3 text-muted-foreground">
                    {formatDateTime(r.created_at)}
                  </td>
                  <td className="px-3 py-3 capitalize">{r.type}</td>
                  <td className="num px-3 py-3 font-medium">{r.products?.sku}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.products?.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {r.locations?.warehouses?.code} · {r.locations?.name}
                  </td>
                  <td className="num px-3 py-3 text-muted-foreground">{r.ref_label ?? "—"}</td>
                  <td
                    className={`num px-5 py-3 text-right font-medium ${r.delta < 0 ? "text-status-backorder" : "text-status-done"}`}
                  >
                    {r.delta > 0 ? "+" : ""}
                    {r.delta.toLocaleString()}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No movements match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
