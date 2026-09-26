import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { supabase } from "@/integrations/supabase/client";
import { fetchProducts, fetchReceipt, formatDate, money } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/receipts/$id")({
  component: ReceiptDetail,
});

function ReceiptDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const receipt = useQuery({ queryKey: ["receipt", id], queryFn: () => fetchReceipt(id) });
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(0);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["receipt", id] });
    queryClient.invalidateQueries({ queryKey: ["receipts"] });
    queryClient.invalidateQueries({ queryKey: ["stock"] });
    queryClient.invalidateQueries({ queryKey: ["ledger"] });
  };

  const addLine = useMutation({
    mutationFn: async () => {
      if (!productId) throw new Error("Pick a product");
      const { error } = await supabase.from("receipt_lines").insert({
        receipt_id: id,
        product_id: productId,
        qty_expected: Number(qty),
        qty_received: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setProductId("");
      setQty(0);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateLine = useMutation({
    mutationFn: async ({ lineId, received }: { lineId: string; received: number }) => {
      const { error } = await supabase
        .from("receipt_lines")
        .update({ qty_received: received })
        .eq("id", lineId);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  const removeLine = useMutation({
    mutationFn: async (lineId: string) => {
      const { error } = await supabase.from("receipt_lines").delete().eq("id", lineId);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  const setStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("receipts")
        .update({ status: status as never })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  const validate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("validate_receipt", { p_receipt_id: id });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (status) => {
      toast.success(
        status === "backorder"
          ? "Receipt validated — some lines came up short, marked as backorder."
          : "Receipt validated. Stock updated.",
      );
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const data = receipt.data;
  const inputCls =
    "rounded-xl border border-input bg-secondary px-3 py-1.5 text-sm outline-none placeholder:text-faint focus:border-ring";

  if (receipt.isLoading) {
    return (
      <AppShell title="Receipt">
        <Panel>
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        </Panel>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell title="Receipt not found">
        <Panel>
          <p className="p-6 text-sm text-muted-foreground">
            This receipt no longer exists.{" "}
            <Link to="/receipts" className="text-accent">
              Back to receipts
            </Link>
          </p>
        </Panel>
      </AppShell>
    );
  }

  const lines = data.receipt_lines ?? [];
  const closed = data.status === "done" || data.status === "canceled";
  const total = lines.reduce(
    (sum, l) => sum + (l.qty_received || l.qty_expected) * (l.products?.unit_cost ?? 0),
    0,
  );

  return (
    <AppShell
      title={`Receipt ${data.reference}`}
      subtitle={`${data.supplier} → ${data.warehouses?.code} · ${data.locations?.name} · expected ${formatDate(data.expected_date)}`}
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
                <option value="draft">draft</option>
                <option value="waiting">waiting</option>
                <option value="ready">ready</option>
                <option value="canceled">canceled</option>
              </select>
              <button
                onClick={() => validate.mutate()}
                disabled={validate.isPending || lines.length === 0}
                className="rounded-xl gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-brand)] disabled:opacity-60"
              >
                Validate receipt
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
                <th className="px-3 py-3 text-right font-medium">Expected</th>
                <th className="px-3 py-3 text-right font-medium">Received</th>
                <th className="px-3 py-3 text-right font-medium">Unit cost</th>
                <th className="px-5 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-b border-border/60 last:border-0">
                  <td className="num px-5 py-3 font-medium">{l.products?.sku}</td>
                  <td className="px-3 py-3 text-muted-foreground">{l.products?.name}</td>
                  <td className="num px-3 py-3 text-right">
                    {(l.qty_expected ?? 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {closed ? (
                      <span className="num">{(l.qty_received ?? 0).toLocaleString()}</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        defaultValue={l.qty_received ?? 0}
                        onBlur={(e) =>
                          updateLine.mutate({ lineId: l.id, received: Number(e.target.value) })
                        }
                        className={`${inputCls} num w-24 text-right`}
                      />
                    )}
                  </td>
                  <td className="num px-3 py-3 text-right">{money(l.products?.unit_cost ?? 0)}</td>
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
              ))}
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No lines yet — add the products this supplier is sending.
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
              placeholder="Expected qty"
              className={`${inputCls} num w-32 text-right`}
            />
            <button
              type="submit"
              disabled={addLine.isPending}
              className="rounded-xl border border-border bg-secondary px-4 py-1.5 text-sm font-medium transition hover:bg-input disabled:opacity-60"
            >
              Add line
            </button>
          </form>
        ) : (
          <p className="border-t border-border px-5 py-4 text-xs text-muted-foreground">
            Validated {formatDate(data.validated_at)} — this receipt is closed and its ledger entries
            are permanent.
          </p>
        )}
      </Panel>
    </AppShell>
  );
}
