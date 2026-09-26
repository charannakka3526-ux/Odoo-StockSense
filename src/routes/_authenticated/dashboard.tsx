import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import {
  fetchDeliveries,
  fetchReceipts,
  fetchStock,
  fetchWarehouses,
  formatDate,
  money,
} from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const statuses = ["draft", "waiting", "picking", "packing", "ready", "done", "backorder"] as const;

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="text-xs tracking-[0.12em] text-faint uppercase">{label}</div>
      <div className="num mt-2 font-display text-2xl font-semibold">{value}</div>
      <div className="mt-2 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function Dashboard() {
  const stock = useQuery({ queryKey: ["stock"], queryFn: fetchStock });
  const receipts = useQuery({ queryKey: ["receipts"], queryFn: fetchReceipts });
  const deliveries = useQuery({ queryKey: ["deliveries"], queryFn: fetchDeliveries });
  const warehouses = useQuery({ queryKey: ["warehouses"], queryFn: fetchWarehouses });

  const [docType, setDocType] = useState<"all" | "receipt" | "delivery">("all");
  const [status, setStatus] = useState<string>("open");
  const [warehouse, setWarehouse] = useState<string>("all");

  const kpis = useMemo(() => {
    const rows = stock.data ?? [];
    const scoped = rows.filter(
      (r) => warehouse === "all" || r.locations?.warehouse_id === warehouse,
    );
    const units = scoped.reduce((sum, r) => sum + r.quantity, 0);
    const value = scoped.reduce((sum, r) => sum + r.quantity * (r.products?.unit_cost ?? 0), 0);
    const low = scoped.filter(
      (r) => r.quantity > 0 && r.quantity < (r.products?.reorder_point ?? 0),
    ).length;
    const out = scoped.filter((r) => r.quantity === 0).length;
    const pendingReceipts = (receipts.data ?? []).filter(
      (r) => !["done", "canceled"].includes(r.status),
    ).length;
    const pendingDeliveries = (deliveries.data ?? []).filter(
      (d) => !["done", "canceled"].includes(d.status),
    ).length;
    return { units, value, low, out, skus: scoped.length, pendingReceipts, pendingDeliveries };
  }, [stock.data, receipts.data, deliveries.data, warehouse]);

  const docs = useMemo(() => {
    type Doc = {
      id: string;
      kind: "receipt" | "delivery";
      reference: string;
      party: string;
      status: string;
      date: string | null;
      warehouseId: string | undefined;
      warehouseCode: string;
      lines: number;
    };
    const rec: Doc[] = (receipts.data ?? []).map((r) => ({
      id: r.id,
      kind: "receipt",
      reference: r.reference,
      party: r.supplier,
      status: r.status,
      date: r.expected_date,
      warehouseId: (warehouses.data ?? []).find((w) => w.code === r.warehouses?.code)?.id,
      warehouseCode: r.warehouses?.code ?? "—",
      lines: r.receipt_lines?.length ?? 0,
    }));
    const del: Doc[] = (deliveries.data ?? []).map((d) => ({
      id: d.id,
      kind: "delivery",
      reference: d.reference,
      party: d.customer,
      status: d.status,
      date: d.scheduled_date,
      warehouseId: (warehouses.data ?? []).find((w) => w.code === d.warehouses?.code)?.id,
      warehouseCode: d.warehouses?.code ?? "—",
      lines: d.delivery_lines?.length ?? 0,
    }));
    return [...rec, ...del]
      .filter((d) => docType === "all" || d.kind === docType)
      .filter((d) =>
        status === "all"
          ? true
          : status === "open"
            ? !["done", "canceled"].includes(d.status)
            : d.status === status,
      )
      .filter((d) => warehouse === "all" || d.warehouseId === warehouse);
  }, [receipts.data, deliveries.data, warehouses.data, docType, status, warehouse]);

  const selectCls =
    "rounded-xl border border-input bg-secondary px-3 py-1.5 text-sm outline-none focus:border-ring";

  return (
    <AppShell
      title="Inventory operations"
      subtitle="Live stock position and every open document across your warehouses."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="On-hand value"
          value={money(kpis.value)}
          hint={`${kpis.units.toLocaleString()} units · ${kpis.skus} stocked lines`}
        />
        <Kpi
          label="Low / out of stock"
          value={`${kpis.low} / ${kpis.out}`}
          hint="Below reorder point / at zero"
        />
        <Kpi
          label="Pending receipts"
          value={String(kpis.pendingReceipts)}
          hint="Awaiting validation"
        />
        <Kpi
          label="Pending deliveries"
          value={String(kpis.pendingDeliveries)}
          hint="Picking, packing or ready"
        />
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
          <span className="text-xs tracking-[0.12em] text-faint uppercase">Filters</span>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as typeof docType)}
            className={selectCls}
          >
            <option value="all">All documents</option>
            <option value="receipt">Receipts</option>
            <option value="delivery">Deliveries</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
            <option value="open">Open only</option>
            <option value="all">Any status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            className={selectCls}
          >
            <option value="all">All warehouses</option>
            {(warehouses.data ?? []).map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} · {w.name}
              </option>
            ))}
          </select>
          <span className="num ml-auto text-xs text-faint">{docs.length} documents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs tracking-[0.1em] text-faint uppercase">
                <th className="px-5 py-3 text-left font-medium">Document</th>
                <th className="px-3 py-3 text-left font-medium">Type</th>
                <th className="px-3 py-3 text-left font-medium">Partner</th>
                <th className="px-3 py-3 text-left font-medium">Warehouse</th>
                <th className="px-3 py-3 text-right font-medium">Lines</th>
                <th className="px-3 py-3 text-left font-medium">Date</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={`${d.kind}-${d.id}`} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3">
                    <Link
                      to={d.kind === "receipt" ? "/receipts/$id" : "/deliveries/$id"}
                      params={{ id: d.id }}
                      className="num font-medium text-accent"
                    >
                      {d.reference}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground capitalize">{d.kind}</td>
                  <td className="px-3 py-3">{d.party}</td>
                  <td className="px-3 py-3 text-muted-foreground">{d.warehouseCode}</td>
                  <td className="num px-3 py-3 text-right">{d.lines}</td>
                  <td className="num px-3 py-3 text-muted-foreground">{formatDate(d.date)}</td>
                  <td className="px-5 py-3">
                    <StatusPill status={d.status} />
                  </td>
                </tr>
              ))}
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No documents match these filters.
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
