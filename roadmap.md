# StockSense roadmap

## Done (core)
- Lovable Cloud backend: profiles, roles, warehouses/locations, categories, products, stock levels, append-only stock ledger, receipts + lines, delivery orders + lines
- Atomic `validate_receipt` / `validate_delivery` database functions with row locking and negative-stock protection
- Email/password + Google sign-in, protected app area
- Landing page, dashboard with KPIs and document filters, stock list with search/filters and product creation, receipts (list + detail + validate), deliveries (list + detail + status flow + validate), move ledger with filters

## Next
- Internal transfers (two-sided move between locations)
- Stock adjustments (counted vs recorded reconciliation)
- Warehouse/location management screen
- Low-stock alert notifications (scheduled job or post-validation trigger)
- OTP-based password reset
