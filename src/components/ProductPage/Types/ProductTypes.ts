// src/types/ProductTypes.ts

export interface Size {
  _id: string;
  size: string;
  stock: number;
}

export interface Variant {
  _id: string;
  mrp: number;
  price: number;
  discount: number;
  sizes: Size[];
  [key: string]: any; // optional additional fields
}

export interface Product {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  variants: Variant[];
  totalStock?: number;
  [key: string]: any;
}

export interface ChangedStock {
  variantId: string;
  sizeId: string;
  size: string;
  stock: number;
}
