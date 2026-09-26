import { supabase } from "@/integrations/supabase/client";

export type StockRow = {
  product_id: string;
  location_id: string;
  quantity: number;
  products: {
    sku: string;
    name: string;
    unit_cost: number;
    reorder_point: number;
    unit_of_measure: string;
    categories: { name: string } | null;
  } | null;
  locations: { name: string; warehouse_id: string; warehouses: { code: string } | null } | null;
};

export async function fetchStock(): Promise<StockRow[]> {
  const { data, error } = await supabase
    .from("stock_levels")
    .select(
      "product_id, location_id, quantity, products(sku, name, unit_cost, reorder_point, unit_of_measure, categories(name)), locations(name, warehouse_id, warehouses(code))",
    )
    .order("quantity", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as StockRow[];
}

export async function fetchWarehouses() {
  const { data, error } = await supabase
    .from("warehouses")
    .select("id, code, name, locations(id, name)")
    .order("code");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCategories() {
  const { data, error } = await supabase.from("categories").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name, unit_cost, reorder_point, unit_of_measure, category_id, categories(name)")
    .order("sku");
  if (error) throw error;
  return data ?? [];
}

export async function fetchReceipts() {
  const { data, error } = await supabase
    .from("receipts")
    .select(
      "id, reference, supplier, status, expected_date, created_at, warehouses(code, name), locations(name), receipt_lines(id, qty_expected, qty_received)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchReceipt(id: string) {
  const { data, error } = await supabase
    .from("receipts")
    .select(
      "id, reference, supplier, status, expected_date, validated_at, warehouses(code, name), locations(name), receipt_lines(id, qty_expected, qty_received, products(id, sku, name, unit_cost))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchDeliveries() {
  const { data, error } = await supabase
    .from("delivery_orders")
    .select(
      "id, reference, customer, status, scheduled_date, created_at, warehouses(code, name), locations(name), delivery_lines(id, qty)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDelivery(id: string) {
  const { data, error } = await supabase
    .from("delivery_orders")
    .select(
      "id, reference, customer, status, scheduled_date, validated_at, location_id, warehouses(code, name), locations(name), delivery_lines(id, qty, products(id, sku, name, unit_cost))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchLedger() {
  const { data, error } = await supabase
    .from("stock_ledger")
    .select(
      "id, delta, type, ref_label, created_at, products(sku, name), locations(name, warehouse_id, warehouses(code))",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function compact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
