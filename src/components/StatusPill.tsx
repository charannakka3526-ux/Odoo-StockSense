const styles: Record<string, string> = {
  draft: "bg-status-draft/15 text-status-draft",
  waiting: "bg-status-progress/15 text-status-progress",
  picking: "bg-status-progress/15 text-status-progress",
  packing: "bg-status-progress/15 text-status-progress",
  ready: "bg-status-ready/15 text-status-ready",
  done: "bg-status-done/15 text-status-done",
  backorder: "bg-status-backorder/15 text-status-backorder",
  canceled: "bg-status-canceled/15 text-status-canceled",
};

const labels: Record<string, string> = {
  draft: "Draft",
  waiting: "Waiting",
  picking: "Picking",
  packing: "Packing",
  ready: "Ready",
  done: "Done",
  backorder: "Backorder",
  canceled: "Canceled",
};

export function StatusPill({ status }: { status: string }) {
  const style = styles[status] ?? styles["draft"]!;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {labels[status] ?? status}
    </span>
  );
}

export function StockPill({ quantity, reorderPoint }: { quantity: number; reorderPoint: number }) {
  const state =
    quantity === 0 ? "out" : quantity < reorderPoint ? "low" : ("ok" as "out" | "low" | "ok");
  const map = {
    out: { cls: "bg-status-canceled/15 text-status-canceled", label: "Out of stock" },
    low: { cls: "bg-status-progress/15 text-status-progress", label: "Low stock" },
    ok: { cls: "bg-status-done/15 text-status-done", label: "In stock" },
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${map[state].cls}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {map[state].label}
    </span>
  );
}
