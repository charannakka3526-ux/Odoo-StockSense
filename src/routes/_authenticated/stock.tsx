import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel } from "@/components/AppShell";
import { StockPill } from "@/components/StatusPill";
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories, fetchStock, fetchWarehouses, money } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/stock")({
  component: StockPage,
});

function StockPage() {
  const queryClient = useQueryClient();
  const stock = useQuery({ queryKey: ["stock"], queryFn: fetchStock });
  const warehouses = useQuery({ queryKey: ["warehouses"], queryFn: fetchWarehouses });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("all");
  const [category, setCategory] = useState("all");
  const [onlyLow, setOnlyLow] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    sku: "",
    name: "",
    category_id: "",
    unit_of_measure: "unit",
    reorder_point: 0,
    reorder_qty: 0,
    unit_cost: 0,
    location_id: "",
    quantity: 0,
  });

  const createProduct = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .insert({
          sku: form.sku.trim(),
          name: form.name.trim(),
          category_id: form.category_id || null,
          unit_of_measure: form.unit_of_measure,
          reorder_point: Number(form.reorder_point),
          reorder_qty: Number(form.reorder_qty),
          unit_cost: Number(form.unit_cost),
        })
        .select("id")
        .single();
      if (error) throw error;
      if (form.location_id) {
        const { error: stockError } = await supabase.from("stock_levels").insert({
          product_id: data.id,
          location_id: form.location_id,
          quantity: Number(form.quantity),
        });
        if (stockError) throw stockError;
        if (Number(form.quantity) > 0) {
          const { data: user } = await supabase.auth.getUser();
          await supabase.from("stock_ledger").insert({
            product_id: data.id,
            location_id: form.location_id,
            delta: Number(form.quantity),
            type: "adjustment",
            ref_label: "Opening balance",
            created_by: user.user?.id ?? null,
          });
        }
      }
    },
    onSuccess: () => {
      toast.success("Product added");
      setShowForm(false);
      setForm({
        sku: "",
        name: "",
        category_id: "",
        unit_of_measure: "unit",
        reorder_point: 0,
        reorder_qty: 0,
        unit_cost: 0,
        location_id: "",
        quantity: 0,
      });
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (stock.data ?? [])
      .filter((r) => (warehouse === "all" ? true : r.locations?.warehouse_id === warehouse))
      .filter((r) => (category === "all" ? true : r.products?.categories?.name === category))
      .filter((r) =>
        term
          ? `${r.products?.sku ?? ""} ${r.products?.name ?? ""}`.toLowerCase().includes(term)
          : true,
      )
      .filter((r) => (onlyLow ? r.quantity < (r.products?.reorder_point ?? 0) : true));
  }, [stock.data, search, warehouse, category, onlyLow]);

  const inputCls =
    "rounded-xl border border-input bg-secondary px-3 py-1.5 text-sm outline-none placeholder:text-faint focus:border-ring";
  const locations = (warehouses.data ?? []).flatMap((w) =>
    (w.locations ?? []).map((l) => ({ id: l.id, label: `${w.code} · ${l.name}` })),
  );

  return (
    <AppShell
      title="Stock list"
      subtitle="Every product and its on-hand quantity, location by location."
      actions={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-brand)]"
        >
          {showForm ? "Close" : "New product"}
        </button>
      }
    >
      {showForm ? (
        <Panel title="New product">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createProduct.mutate();
            }}
            className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            <input
              required
              placeholder="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className={inputCls}
            />
            <input
              required
              placeholder="Product name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className={inputCls}
            >
              <option value="">No category</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Unit of measure"
              value={form.unit_of_measure}
              onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })}
              className={inputCls}
            />
            <input
              type="number"
              min={0}
              placeholder="Reorder point"
              value={form.reorder_point}
              onChange={(e) => setForm({ ...form, reorder_point: Number(e.target.value) })}
              className={inputCls}
            />
            <input
              type="number"
              min={0}
              placeholder="Reorder quantity"
              value={form.reorder_qty}
              onChange={(e) => setForm({ ...form, reorder_qty: Number(e.target.value) })}
              className={inputCls}
            />
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="Unit cost"
              value={form.unit_cost}
              onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })}
              className={inputCls}
            />
            <select
              value={form.location_id}
              onChange={(e) => setForm({ ...form, location_id: e.target.value })}
              className={inputCls}
            >
              <option value="">No opening stock</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              placeholder="Opening quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              className={inputCls}
            />
            <button
              type="submit"
              disabled={createProduct.isPending}
              className="rounded-xl gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              Save product
            </button>
          </form>
        </Panel>
      ) : null}

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
          <input
            placeholder="Search SKU or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} w-56`}
          />
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
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputCls}
          >
            <option value="all">All categories</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={onlyLow}
              onChange={(e) => setOnlyLow(e.target.checked)}
              className="accent-accent"
            />
            Needs reordering
          </label>
          <span className="num ml-auto text-xs text-faint">{rows.length} rows</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs tracking-[0.1em] text-faint uppercase">
                <th className="px-5 py-3 text-left font-medium">SKU</th>
                <th className="px-3 py-3 text-left font-medium">Product</th>
                <th className="px-3 py-3 text-left font-medium">Category</th>
                <th className="px-3 py-3 text-left font-medium">Location</th>
                <th className="px-3 py-3 text-right font-medium">On-hand</th>
                <th className="px-3 py-3 text-right font-medium">Reorder pt</th>
                <th className="px-3 py-3 text-right font-medium">Unit cost</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={`${r.product_id}-${r.location_id}`}
                  className="border-b border-border/60 transition hover:bg-secondary/60 last:border-0"
                >
                  <td className="num px-5 py-3 font-medium">{r.products?.sku}</td>
                  <td className="px-3 py-3">{r.products?.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {r.products?.categories?.name ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {r.locations?.warehouses?.code} · {r.locations?.name}
                  </td>
                  <td className="num px-3 py-3 text-right">
                    {r.quantity.toLocaleString()}{" "}
                    <span className="text-faint">{r.products?.unit_of_measure}</span>
                  </td>
                  <td className="num px-3 py-3 text-right text-faint">
                    {(r.products?.reorder_point ?? 0).toLocaleString()}
                  </td>
                  <td className="num px-3 py-3 text-right">{money(r.products?.unit_cost ?? 0)}</td>
                  <td className="px-5 py-3">
                    <StockPill
                      quantity={r.quantity}
                      reorderPoint={r.products?.reorder_point ?? 0}
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    Nothing matches these filters.
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
