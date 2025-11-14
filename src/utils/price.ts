// utils/price.ts
export const calcDiscount = (mrp: number, price: number): number => {
  if (!mrp || mrp <= 0) return 0;
  const disc = ((mrp - price) / mrp) * 100;
  return Math.round(disc * 100) / 100; // 2-dp
};

export const calcPriceFromDiscount = (mrp: number, discount: number): number => {
  if (!mrp || mrp <= 0) return 0;
  const price = mrp * (1 - discount / 100);
  return Math.round(price * 100) / 100; // 2-dp
};