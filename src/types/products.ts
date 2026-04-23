/** Which variant axes apply to this logical product (drives validation and UI hints). */
export interface VariantDimensions {
  size: boolean;
  colour: boolean;
  style: boolean;
}

/** Sellable SKU row; size / colour / style support apparel buying workflows. */
export interface ProductVariant {
  id: string;
  sku: string;
  /** Supplier or internal style code for this SKU (optional). */
  model?: string;
  upc: string;
  ean: string;
  gtin: string;
  size: string;
  colour: string;
  style: string;
  description?: string;
  basePrice?: number | null;
  listPrice?: number | null;
  activeYn: string;
}

/** Logical product (buyer-facing) containing one or more SKU variants. */
export interface Product {
  id?: string;
  /** Logical product name shown to buyers (e.g. Buc-ee's Logo T-Shirt – Heather Grey). */
  displayName: string;
  /** Stable id for the logical product in external systems; often mirrors `id` after create. */
  parentProductId?: string;
  variantDimensions?: VariantDimensions;
  supplierUid: string;
  retailerUid: string;
  departmentUid?: string | null;
  classUid?: string | null;
  subclassUid?: string | null;
  categoryUid?: string | null;
  subcategoryUid?: string | null;
  /** Legacy / aggregate style reference; prefer `variants[].model` for SKU-level model. */
  model?: string;
  /** Optional family or anchor code; sellable SKUs live on variants. */
  sku: string;
  upc: string;
  ean: string;
  gtin: string;
  description: string;
  variants: ProductVariant[];
  basePrice?: number | null;
  listPrice?: number | null;
  priceBy: string;
  weightUom: string;
  weight?: number | null;
  dimensionUom: string;
  unitLength?: number | null;
  unitWidth?: number | null;
  unitHeight?: number | null;
  casePack?: number | null;
  uom: string;
  activeYn: string;
  createdDate?: string | null;
  createdBy: string;
  source: string;
  modifiedDate?: string | null;
  modifiedBy: string;
  deletedYn: string;
}

export interface CreateProductVariantPayload {
  id?: string;
  sku: string;
  model?: string;
  upc?: string;
  ean?: string;
  gtin?: string;
  size: string;
  colour: string;
  style: string;
  description?: string;
  basePrice?: number | null;
  listPrice?: number | null;
  activeYn?: string;
}

export interface CreateProductRequest {
  displayName: string;
  parentProductId?: string | null;
  variantDimensions?: VariantDimensions | null;
  supplierUid: string;
  retailerUid: string;
  departmentUid?: string | null;
  classUid?: string | null;
  subclassUid?: string | null;
  categoryUid?: string | null;
  subcategoryUid?: string | null;
  model?: string;
  sku?: string;
  upc?: string;
  ean?: string;
  gtin?: string;
  description?: string;
  variants: CreateProductVariantPayload[];
  basePrice?: number | null;
  listPrice?: number | null;
  priceBy?: string;
  weightUom?: string;
  weight?: number | null;
  dimensionUom?: string;
  unitLength?: number | null;
  unitWidth?: number | null;
  unitHeight?: number | null;
  casePack?: number | null;
  uom?: string;
  activeYn?: string;
  createdDate?: string | null;
  createdBy?: string;
  source?: string;
  modifiedDate?: string | null;
  modifiedBy?: string;
  deletedYn?: string;
}

export interface UpdateProductRequest extends CreateProductRequest {
  id: string;
}

export interface ProductVariantFormData {
  id: string;
  sku: string;
  model: string;
  upc: string;
  ean: string;
  gtin: string;
  size: string;
  colour: string;
  style: string;
  description: string;
  basePrice: string;
  listPrice: string;
  activeYn: string;
}

export interface ProductFormData {
  supplierUid: string;
  retailerUid: string;
  departmentUid: string;
  classUid: string;
  subclassUid: string;
  categoryUid: string;
  subcategoryUid: string;
  displayName: string;
  parentProductId: string;
  variantDimSizeYn: 'Y' | 'N';
  variantDimColourYn: 'Y' | 'N';
  variantDimStyleYn: 'Y' | 'N';
  sku: string;
  upc: string;
  ean: string;
  gtin: string;
  description: string;
  variants: ProductVariantFormData[];
  basePrice: string;
  listPrice: string;
  priceBy: string;
  weightUom: string;
  weight: string;
  dimensionUom: string;
  unitLength: string;
  unitWidth: string;
  unitHeight: string;
  casePack: string;
  uom: string;
  activeYn: string;
  createdDate: string;
  createdBy: string;
  source: string;
  modifiedDate: string;
  modifiedBy: string;
  deletedYn: string;
}

/** Product row with resolved retailer / supplier / hierarchy labels for the grid. */
export type ProductGridRowProduct = Product & {
  retailerName: string;
  supplierName: string;
  departmentName: string;
  className: string;
  subclassName: string;
  categoryName: string;
  subcategoryName: string;
};

/** Parent row or an expanded SKU child row. */
export type ProductManagementGridRow =
  | { rowKind: 'product'; product: ProductGridRowProduct }
  | { rowKind: 'variant'; product: ProductGridRowProduct; variant: ProductVariant };
