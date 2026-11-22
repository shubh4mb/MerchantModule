# src/pages/

Screens. A page composes components and calls `api/`; it holds no business rules and never calls axios
directly.

| Area | Pages |
|---|---|
| **Auth / onboarding** | `auth/Login`, `auth/FlashFitsSignUp`, `auth/ForgotPassword`, `auth/Register`, `auth/MapSelector`, `auth/LogoCrop/`, `auth/BannerCrop/`, `auth/PaymentPage`, `auth/PendingVerification`, `auth/RejectedPage` |
| **Orders** | `OrderManagement`, `CourierOrders`, `order/MobileUploadProof` |
| **Catalogue** | `products/AddNewProduct`, `products/EditProductPage`, `products/InventoryPage`, `products/BulkUploadProducts`, `products/StockQuickUpdate` ⚠ unrouted |
| **Warehouse** | `warehouse/WarehouseDashboard`, `warehouse/WarehouseInventory`, `warehouse/WarehouseOrderManagement`, `warehouse/MerchantWarehouseStock` |
| **Money** | `Revenue` |
| **Promotions** | `OffersPage` |
| **Other** | `Dashboard`, `ProfilePage`, `ZipCovers`, `PoliciesPage`, `brands/AddBrandPage` |

## The screens that carry the most risk

| Page | Why |
|---|---|
| `OrderManagement.tsx` | the accept window. A missed order is a lost sale — and the alert that drives this screen has an autoplay problem (see [../context/README.md](../context/README.md)). |
| `Revenue.tsx` (989 lines) | the payout figures. A merchant comparing this against their bank statement and finding a difference is a trust problem. Week selector only today — the custom-range work is [reports/earnings-and-payouts.md](../../../../FF_api_web/docs/reports/earnings-and-payouts.md). |
| `OffersPage.tsx` | a merchant's own discount comes out of their own payout. The form must say so. Merchants also cannot grant free delivery on courier orders — currently stripped silently rather than explained. [reports/coupons-and-offers.md §8.4](../../../../FF_api_web/docs/reports/coupons-and-offers.md) |
| `products/BulkUploadProducts.tsx` | a malformed CSV row must produce a per-row error, not a silent partial import. |
| `auth/Register.tsx` | KYC, bank details and documents. Collects the data a payout depends on. |

## Gotchas

- **`StockQuickUpdate` exists but is unreachable** (`App.tsx:118` commented out).
- **`order/MobileUploadProof.tsx` is a public route** by design — no auth, opened from a phone.
- **Every amount comes from the server.** Do not recompute a payout, commission or total in a page.
- Money is `en-IN` formatted with `₹`. Dates are IST; ask the server for period presets rather than
  computing "this week" in the browser.
- `AddVarient` (sic) is the spelling used in paths — a baked-in typo.
