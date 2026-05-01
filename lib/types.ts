export type Id = string;

export interface NamedEntity {
  id: Id;
  name: string;
}

export type Category = NamedEntity;
export type Size = NamedEntity;

export interface Subcategory extends NamedEntity {
  category_id: Id;
  category_name?: string;
}

export interface Product {
  id: Id;
  name: string;
  sale_price: number;
  brand_id: Id;
  subcategory_id: Id;
  color_id: Id;
  condition_id: Id;
  purchase_price?: number | null;
  entry_date?: string | null;
  exit_date?: string | null;
  description?: string | null;
  measurements?: string | null;
  reference_code?: string | null;
}

export interface ProductListItem {
  id: Id;
  name: string;
  price: number;
  measurements: string;
  sizeNames: string[];
  brandName: string;
  subcategoryName: string;
  colorName: string;
  conditionName: string;
  visibleInCatalog: boolean;
  referenceCode: string;
}

export interface ProductFormValues {
  name: string;
  price: string;
  brand_id: Id;
  subcategory_id: Id;
  color_id: Id;
  condition_id: Id;
  visibleInCatalog: boolean;
  size_ids: Id[];
  purchase_price: string;
  entry_date: string;
  exit_date: string;
  description: string;
  measurements: string;
}

export interface ProductImage {
  id: Id;
  product_id: Id;
  image_url: string;
  is_cover: boolean;
}

export interface ProductLookups {
  brands: NamedEntity[];
  categories: Category[];
  subcategories: Subcategory[];
  colors: NamedEntity[];
  conditions: NamedEntity[];
  sizes: Size[];
}
