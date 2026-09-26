/** Drifting aurora blooms that sit behind every StockSense surface. */
export function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="animate-drift absolute -top-40 -left-32 size-[520px] rounded-full bg-brand/35 blur-[120px]" />
      <div className="animate-drift2 absolute top-1/3 -right-40 size-[560px] rounded-full bg-accent/20 blur-[130px]" />
      <div className="animate-drift3 absolute -bottom-40 left-1/3 size-[480px] rounded-full bg-primary/25 blur-[120px]" />
    </div>
  );
}
