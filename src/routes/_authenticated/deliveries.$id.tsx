import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { supabase } from "@/integrations/supabase/client";
import { fetchDelivery, fetchProducts, fetchStock, formatDate, money } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/deliveries/$id")({
  component: DeliveryDetail,
});

const flow = ["draft", "picking", "packing", "ready"] as const;

function DeliveryDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const delivery = useQuery({ queryKey: ["delivery", id], queryFn: () => fetchDelivery(id) });
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const stock = useQuery({ queryKey: ["stock"], queryFn: fetchStock });

  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(0);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["delivery", id] });
    queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    queryClient.invalidateQueries({ queryKey: ["stock"] });
    queryClient.invalidateQueries({ queryKey: ["ledger"] });
  };

  const addLine = useMutation({
    mutationFn: async () => {
      if (!productId) throw new Error("Pick a product");
      const { error } = await supabase
        .from("delivery_lines")
        .insert({ delivery_id: id, product_id: productId, qty: Number(qty) });
      if (error) throw error;
    },
    onSuccess: () => {
      setProductId("");
      setQty(0);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeLine = useMutation({
    mutationFn: async (lineId: string) => {
      const { error } = await supabase.from("delivery_lines").delete().eq("id", lineId);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  const setStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("delivery_orders")
        .update({ status: status as never })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  const validate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("validate_delivery", { p_delivery_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Delivery validated. Stock reduced and logged.");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const data = delivery.data;
  const inputCls =
    "rounded-xl border border-input bg-secondary px-3 py-1.5 text-sm outline-none placeholder:text-faint focus:border-ring";

  if (delivery.isLoading) {
    return (
      <AppShell title="Delivery order">
        <Panel>
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        </Panel>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell title="Delivery not found">
        <Panel>
          <p className="p-6 text-sm text-muted-foreground">
            This delivery order no longer exists.{" "}
            <Link to="/deliveries" className="text-accent">
              Back to deliveries
            </Link>
          </p>
        </Panel>
      </AppShell>
    );
  }

  const lines = data.delivery_lines ?? [];
  const closed = data.status === "done" || data.status === "canceled";
  const total = lines.reduce((sum, l) => sum + l.qty * (l.products?.unit_cost ?? 0), 0);
  const available = (productIdToCheck: string) =>
    (stock.data ?? []).find(
      (s) => s.product_id === productIdToCheck && s.location_id === data.location_id,
    )?.quantity ?? 0;
  const shortLines = lines.filter((l) => l.products && l.qty > available(l.products.id));

  return (
    <AppShell
      title={`Delivery ${data.reference}`}
      subtitle={`${data.customer} ← ${data.warehouses?.code} · ${data.locations?.name} · scheduled ${formatDate(data.scheduled_date)}`}
      actions={
        <>
          <StatusPill status={data.status} />
          {!closed ? (
            <>
              <select
                value={data.status}
                onChange={(e) => setStatus.mutate(e.target.value)}
                className={inputCls}
              >
                {flow.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="canceled">canceled</option>
              </select>
              <button
                onClick={() => validate.mutate()}
                disabled={validate.isPending || lines.length === 0 || shortLines.length > 0}
                className="rounded-xl gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-brand)] disabled:opacity-50"
              >
                Validate delivery
              </button>
            </>
          ) : null}
        </>
      }
    >
      <Panel title="Lines" right={<span className="num text-xs text-faint">{money(total)}</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs tracking-[0.1em] text-faint uppercase">
                <th className="px-5 py-3 text-left font-medium">SKU</th>
                <th className="px-3 py-3 text-left font-medium">Product</th>
                <th className="px-3 py-3 text-right font-medium">Quantity</th>
                <th className="px-3 py-3 text-right font-medium">At this location</th>
                <th className="px-3 py-3 text-right font-medium">Line value</th>
                <th className="px-5 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const have = l.products ? available(l.products.id) : 0;
                const short = l.qty > have;
                return (
                  <tr key={l.id} className="border-b border-border/60 last:border-0">
                    <td className="num px-5 py-3 font-medium">{l.products?.sku}</td>
                    <td className="px-3 py-3 text-muted-foreground">{l.products?.name}</td>
                    <td className="num px-3 py-3 text-right">{l.qty.toLocaleString()}</td>
                    <td
                      className={`num px-3 py-3 text-right ${short ? "text-status-backorder" : "text-muted-foreground"}`}
                    >
                      {have.toLocaleString()}
                    </td>
                    <td className="num px-3 py-3 text-right">
                      {money(l.qty * (l.products?.unit_cost ?? 0))}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!closed ? (
                        <button
                          onClick={() => removeLine.mutate(l.id)}
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          Remove
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No lines yet — add the products going out.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {!closed ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addLine.mutate();
            }}
            className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-4"
          >
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={`${inputCls} w-72`}
            >
              <option value="">Add a product…</option>
              {(products.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              placeholder="Quantity"
              className={`${inputCls} num w-32 text-right`}
            />
            <button
              type="submit"
              disabled={addLine.isPending}
              className="rounded-xl border border-border bg-secondary px-4 py-1.5 text-sm font-medium transition hover:bg-input disabled:opacity-60"
            >
              Add line
            </button>
            {shortLines.length > 0 ? (
              <span className="text-xs text-status-backorder">
                Not enough stock on {shortLines.length} line
                {shortLines.length > 1 ? "s" : ""} — validation is blocked.
              </span>
            ) : null}
          </form>
        ) : (
          <p className="border-t border-border px-5 py-4 text-xs text-muted-foreground">
            Validated {formatDate(data.validated_at)} — this order is closed and its ledger entries
            are permanent.
          </p>
        )}
      </Panel>
    </AppShell>
  );
}
