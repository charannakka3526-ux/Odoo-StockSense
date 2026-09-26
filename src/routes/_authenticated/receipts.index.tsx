import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { supabase } from "@/integrations/supabase/client";
import { fetchReceipts, fetchWarehouses, formatDate } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/receipts/")({
  head: () => ({
    meta: [
      { title: "Receipts — StockSense" },
      {
        name: "description",
        content: "Incoming supplier deliveries: log expected lines and validate to add stock.",
      },
      { property: "og:title", content: "Receipts — StockSense" },
      {
        property: "og:description",
        content: "Track incoming supplier goods and validate them into stock in one step.",
      },
    ],
  }),
  component: ReceiptsPage,
});

function ReceiptsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const receipts = useQuery({ queryKey: ["receipts"], queryFn: fetchReceipts });
  const warehouses = useQuery({ queryKey: ["warehouses"], queryFn: fetchWarehouses });

  const [showForm, setShowForm] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [locationId, setLocationId] = useState("");
  const [expected, setExpected] = useState("");

  const locations = (warehouses.data ?? []).flatMap((w) =>
    (w.locations ?? []).map((l) => ({
      id: l.id,
      warehouseId: w.id,
      label: `${w.code} · ${l.name}`,
    })),
  );

  const create = useMutation({
    mutationFn: async () => {
      const location = locations.find((l) => l.id === locationId);
      if (!location) throw new Error("Pick a destination location");
      const { data: user } = await supabase.auth.getUser();
      const reference = `RC-${Math.floor(10000 + Math.random() * 89999)}`;
      const { data, error } = await supabase
        .from("receipts")
        .insert({
          reference,
          supplier: supplier.trim(),
          warehouse_id: location.warehouseId,
          location_id: location.id,
          status: "draft",
          expected_date: expected || null,
          created_by: user.user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Draft receipt created");
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      navigate({ to: "/receipts/$id", params: { id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const inputCls =
    "rounded-xl border border-input bg-secondary px-3 py-1.5 text-sm outline-none placeholder:text-faint focus:border-ring";

  return (
    <AppShell
      title="Receipts"
      subtitle="Incoming goods from suppliers. Validate a receipt to add its quantities to stock."
      actions={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-brand)]"
        >
          {showForm ? "Close" : "New receipt"}
        </button>
      }
    >
      {showForm ? (
        <Panel title="New receipt">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input
              required
              placeholder="Supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className={inputCls}
            />
            <select
              required
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className={inputCls}
            >
              <option value="">Destination location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              className={inputCls}
            />
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-xl gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              Create draft
            </button>
          </form>
        </Panel>
      ) : null}

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs tracking-[0.1em] text-faint uppercase">
                <th className="px-5 py-3 text-left font-medium">Reference</th>
                <th className="px-3 py-3 text-left font-medium">Supplier</th>
                <th className="px-3 py-3 text-left font-medium">Destination</th>
                <th className="px-3 py-3 text-right font-medium">Lines</th>
                <th className="px-3 py-3 text-right font-medium">Received / expected</th>
                <th className="px-3 py-3 text-left font-medium">Expected</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(receipts.data ?? []).map((r) => {
                const expectedQty = (r.receipt_lines ?? []).reduce(
                  (s, l) => s + (l.qty_expected ?? 0),
                  0,
                );
                const receivedQty = (r.receipt_lines ?? []).reduce(
                  (s, l) => s + (l.qty_received ?? 0),
                  0,
                );
                return (
                  <tr
                    key={r.id}
                    className="border-b border-border/60 transition hover:bg-secondary/60 last:border-0"
                  >
                    <td className="px-5 py-3">
                      <Link
                        to="/receipts/$id"
                        params={{ id: r.id }}
                        className="num font-medium text-accent"
                      >
                        {r.reference}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{r.supplier}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {r.warehouses?.code} · {r.locations?.name}
                    </td>
                    <td className="num px-3 py-3 text-right">{r.receipt_lines?.length ?? 0}</td>
                    <td className="num px-3 py-3 text-right">
                      {receivedQty.toLocaleString()} / {expectedQty.toLocaleString()}
                    </td>
                    <td className="num px-3 py-3 text-muted-foreground">
                      {formatDate(r.expected_date)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={r.status} />
                    </td>
                  </tr>
                );
              })}
              {(receipts.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No receipts yet.
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
