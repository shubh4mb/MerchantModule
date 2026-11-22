# src/api/

REST clients, one per domain. **A page calls these; it never calls axios directly.**

`utils/axiosInstance.ts` holds the shared instance: base URL, the JWT interceptor (token from
`localStorage`), error normalisation.

| File | Covers |
|---|---|
| `auth.ts` | login, signup, password reset, Google OAuth |
| `order.ts` | live orders, accept/decline, packing, zip-cover seals, returns |
| `courierOrder.ts` | courier orders |
| `products.ts` | catalogue, variants, stock |
| `warehouseOrder.ts` | warehouse fulfilment |
| `offers.ts` | store offers and coupons |
| `analytics.ts` | dashboard metrics and revenue |
| `zipCovers.ts` | zip-cover stock requests |

## Gotchas

- **`analytics.ts` hits `/merchant/analytics?startDate&endDate`** — the only custom-range endpoint in the
  system. The backend currently computes those boundaries in **UTC** while the business runs on IST, so
  every daily figure is shifted 5h30m.
  [reports/earnings-and-payouts.md §2.1](../../../../FF_api_web/docs/reports/earnings-and-payouts.md).
  Do not work around it client-side; it is a backend fix.
- **Send dates as `YYYY-MM-DD` IST calendar dates**, and let the server resolve presets. Three clients
  computing "last week" in browser-local time is three chances to disagree with the payout cron.
- The JWT lives in `localStorage`. After a Capacitor migration this becomes `@capacitor/preferences` or a
  Keychain/Keystore-backed plugin ([../../DESIGN.md](../../../DESIGN.md) §7).
