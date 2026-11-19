// utils/price.ts
export const calcDiscount = (mrp: number, price: number): number => {
  if (!mrp || mrp <= 0 || !price || price <= 0 || price >= mrp) return 0;
  const disc = ((mrp - price) / mrp) * 100;
  return Math.round(disc); // Clean integer percentage (e.g. 20 instead of 20.02)
};

export const calcPriceFromDiscount = (mrp: number, discount: number): number => {
  if (!mrp || mrp <= 0) return 0;
  const disc = Math.max(0, Math.min(100, Number(discount) || 0));
  const price = mrp * (1 - disc / 100);
  return Math.round(price * 100) / 100; // 2-dp
};
