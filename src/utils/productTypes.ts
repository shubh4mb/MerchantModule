export interface Size {
  size: string;
  stock: number;
}

export interface Variant {
  color: { name: string; hex: string };
  sizes: Size[];
  mrp: number;
  price: number;
  discount: number;
  images: any[];
}

export interface ProductData {
  name: string;
  brandId: string;
  categoryId: string;
  subCategoryId?: string;
  subSubCategoryId?: string;
  gender: string;
  description: string;
  features: Record<string, string>;
  tags: string[];
  variants: Variant[];
}

export interface ProductItem {
  data: ProductData;
  images: { file: File | null }[];
}
