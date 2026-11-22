# src/components/

Shared UI. Anything used by exactly one page belongs beside that page.

| Folder | Contents |
|---|---|
| `layout/` | `AppLayout`, `Navbar/Navbar`, `Navbar/NotificationDropdown`, `Sidebar` |
| `Products/` | `ProductTable`, `ProductDetailsModal`, `VariantForm`, `ProductTitleInput`, `MatchingProductsModal`, `LinkMerchantProductModal`, `AddVarient/AddVarient` |
| `ProductPage/` | `DynamicSizesInput` |
| `Brand/` | `AddBrandForm`, `BrandTable` |
| `auth/` | `FloatingAssets` |
| `utils/` | `Modal`, `OnlineToggle`, `CustomColorPicker`, `CustomColorDropdown`, `DynamicSizesInput`, `CropperModal`, `CropperAddVarient`, `croping/cropImage`, `popup/ConfirmDialog` |

## Gotchas

- **Four styling systems coexist** (MUI, Tailwind, framer-motion, per-component `.css`). Match the file you
  are in; do not introduce a fifth.
- **Duplicate implementations to be aware of** — `DynamicSizesInput` exists in both `ProductPage/` and
  `utils/`; cropping is implemented in `CropperModal`, `CropperAddVarient`, `utils/croping/cropImage.js`
  **and** `pages/auth/LogoCrop/utils/cropImage.ts`. Reuse one rather than adding another.
- **`AddVarient` is a misspelling of "variant"** baked into folder and file names.
- **A component that displays money takes a preformatted string or an integer-rupee number** — it never
  computes. `en-IN` with `₹`.
- **Target 360px.** `NotificationDropdown` in particular has to work on a phone, and it is the only
  notification surface this app has (there is no notifications page).
