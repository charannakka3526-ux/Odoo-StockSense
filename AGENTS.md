<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules

- Stock quantities are only ever changed through the `validate_receipt` / `validate_delivery` database functions; they lock rows, write the ledger and update `stock_levels` in one transaction so counts can never go negative or drift.
- `stock_ledger` is append-only (no update/delete grants) and is the source of truth; `stock_levels` is a cache derived from it.
- Inventory data is read/written from the browser Supabase client under RLS (signed-in team members only); protected pages live under `src/routes/_authenticated/`.
- Colors, fonts, gradients and status colors are tokens in `src/styles.css`; components never hardcode color classes.
