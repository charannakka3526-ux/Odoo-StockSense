import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { supabase } from "@/integrations/supabase/client";
import { fetchDeliveries, fetchWarehouses, formatDate } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/deliveries/")({
  head: () => ({
    meta: [
      { title: "Delivery orders — StockSense" },
      {
        name: "description",
        content: "Outgoing orders: pick, pack and validate to take quantities out of stock.",
      },
      { property: "og:title", content: "Delivery orders — StockSense" },
      {
        property: "og:description",
        content: "Pick, pack and validate outgoing orders without ever going below zero stock.",
      },
    ],
  }),
  component: DeliveriesPage,
});

function DeliveriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deliveries = useQuery({ queryKey: ["deliveries"], queryFn: fetchDeliveries });
  const warehouses = useQuery({ queryKey: ["warehouses"], queryFn: fetchWarehouses });

  const [showForm, setShowForm] = useState(false);
  const [customer, setCustomer] = useState("");
  const [locationId, setLocationId] = useState("");
  const [scheduled, setScheduled] = useState("");

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
      if (!location) throw new Error("Pick a source location");
      const { data: user } = await supabase.auth.getUser();
      const reference = `DO-${Math.floor(10000 + Math.random() * 89999)}`;
      const { data, error } = await supabase
        .from("delivery_orders")
        .insert({
          reference,
          customer: customer.trim(),
          warehouse_id: location.warehouseId,
          location_id: location.id,
          status: "draft",
          scheduled_date: scheduled || null,
          created_by: user.user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Draft delivery created");
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      navigate({ to: "/deliveries/$id", params: { id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const inputCls =
    "rounded-xl border border-input bg-secondary px-3 py-1.5 text-sm outline-none placeholder:text-faint focus:border-ring";

  return (
    <AppShell
      title="Delivery orders"
      subtitle="Outgoing goods. Pick, pack, then validate to take quantities out of stock."
      actions={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-brand)]"
        >
          {showForm ? "Close" : "New delivery"}
        </button>
      }
    >
      {showForm ? (
        <Panel title="New delivery order">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input
              required
              placeholder="Customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className={inputCls}
            />
            <select
              required
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className={inputCls}
            >
              <option value="">Source location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
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
                <th className="px-3 py-3 text-left font-medium">Customer</th>
                <th className="px-3 py-3 text-left font-medium">Source</th>
                <th className="px-3 py-3 text-right font-medium">Lines</th>
                <th className="px-3 py-3 text-right font-medium">Units</th>
                <th className="px-3 py-3 text-left font-medium">Scheduled</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(deliveries.data ?? []).map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-border/60 transition hover:bg-secondary/60 last:border-0"
                >
                  <td className="px-5 py-3">
                    <Link
                      to="/deliveries/$id"
                      params={{ id: d.id }}
                      className="num font-medium text-accent"
                    >
                      {d.reference}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{d.customer}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {d.warehouses?.code} · {d.locations?.name}
                  </td>
                  <td className="num px-3 py-3 text-right">{d.delivery_lines?.length ?? 0}</td>
                  <td className="num px-3 py-3 text-right">
                    {(d.delivery_lines ?? [])
                      .reduce((s, l) => s + (l.qty ?? 0), 0)
                      .toLocaleString()}
                  </td>
                  <td className="num px-3 py-3 text-muted-foreground">
                    {formatDate(d.scheduled_date)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={d.status} />
                  </td>
                </tr>
              ))}
              {(deliveries.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No delivery orders yet.
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
