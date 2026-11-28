/**
 * Routes that belong under a nav item but have their own path segment, so the
 * parent stays highlighted while the merchant is on them.
 */
export const NAV_CHILD_ROUTES: Record<string, string[]> = {
  inventory: ["edit", "add-product", "bulk-upload"],
  orders: ["warehouse-orders"],
};

/**
 * Is `itemPath` the active nav item for `pathname`?
 *
 * Compares the first path SEGMENT, never a substring. A substring match made
 * "/merchant/courier-orders" light up Orders as well as Courier, because
 * "courier-orders" contains "orders" (UI-1, docs/ui-fixes-2026-11.md).
 */
export const isNavActive = (pathname: string, itemPath: string): boolean => {
  const segment = pathname.replace(/^\/merchant\/?/, "").split("/")[0];
  return segment === itemPath || (NAV_CHILD_ROUTES[itemPath] ?? []).includes(segment);
};
