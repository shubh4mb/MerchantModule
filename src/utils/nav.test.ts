import { describe, expect, it } from 'vitest';
import { isNavActive } from './nav';

describe('isNavActive', () => {
  it('lights exactly the item whose path matches', () => {
    expect(isNavActive('/merchant/orders', 'orders')).toBe(true);
    expect(isNavActive('/merchant/revenue', 'orders')).toBe(false);
  });

  it('does not light Orders on the Courier page (UI-1)', () => {
    // "courier-orders" contains "orders" — the substring match this replaced
    expect(isNavActive('/merchant/courier-orders', 'courier-orders')).toBe(true);
    expect(isNavActive('/merchant/courier-orders', 'orders')).toBe(false);
  });

  it('keeps Inventory lit on its child routes', () => {
    for (const p of ['edit/abc123', 'add-product', 'bulk-upload']) {
      expect(isNavActive(`/merchant/${p}`, 'inventory'), p).toBe(true);
    }
  });

  it('keeps Orders lit on the warehouse orders route, and nothing else', () => {
    expect(isNavActive('/merchant/warehouse-orders', 'orders')).toBe(true);
    expect(isNavActive('/merchant/warehouse-orders', 'warehouse-stock')).toBe(false);
  });

  it('handles a trailing slash and the bare /merchant root', () => {
    expect(isNavActive('/merchant/orders/', 'orders')).toBe(true);
    expect(isNavActive('/merchant', 'orders')).toBe(false);
  });
});
