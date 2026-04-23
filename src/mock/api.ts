import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '../types/suppliers';
import type { Product, CreateProductRequest, UpdateProductRequest } from '../types/products';
import type { Category, Subcategory } from '../types/categoryHierarchy';
import type { Department, DepartmentClass, Subclass } from '../types/retailerProductHierarchy';
import { Retailer } from '../types/retailers';
import { OrderBrowseRow } from '../types/order';
import { DataRecord } from '../types/record';
import { User } from '../types/users';
import { mockSuppliers } from './data/suppliers';
import { mockRetailers } from './data/retailers';
import { mockOrders } from './orders/mockOrders';
import { mockIncomingData, mockClients, mockRetailerOptions, mockSupplierOptions } from './data/incomingData';
import { mockUsers } from './data/users';
import { mockProductsSeed } from './data/products';
import {
  mockCategories,
  mockDepartmentClasses,
  mockDepartments,
  mockSubcategories,
  mockSubclasses,
} from './data/productLookups';

let suppliers = [...mockSuppliers];

let products: Product[] = [...mockProductsSeed];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): Promise<void> {
  return delay(300 + Math.random() * 500);
}

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

export async function fetchSuppliers(): Promise<Supplier[]> {
  await randomDelay();
  return suppliers.map((s) => ({ ...s }));
}

export async function fetchSupplierById(id: string): Promise<Supplier | null> {
  await randomDelay();
  const found = suppliers.find((s) => s.supplierUid === id);
  return found ? { ...found } : null;
}

export async function createSupplier(data: CreateSupplierRequest): Promise<Supplier> {
  await randomDelay();
  const now = new Date().toISOString();
  const newSupplier: Supplier = {
    supplierUid: generateUuid(),
    name: data.name,
    shortCode: data.shortCode,
    email: data.email,
    phoneNumber: data.phoneNumber,
    activeYn: 'Y',
    deletedYn: 'N',
    createdDate: now,
    createdBy: 'demo@gocrisp.com',
    modifiedDate: now,
    modifiedBy: 'demo@gocrisp.com',
  };
  suppliers = [...suppliers, newSupplier];
  return { ...newSupplier };
}

export async function updateSupplier(data: UpdateSupplierRequest): Promise<Supplier> {
  await randomDelay();
  const idx = suppliers.findIndex((s) => s.supplierUid === data.supplierUid);
  if (idx === -1) throw new Error(`Supplier ${data.supplierUid} not found`);

  const updated: Supplier = {
    ...suppliers[idx],
    name: data.name,
    shortCode: data.shortCode,
    email: data.email,
    phoneNumber: data.phoneNumber,
    modifiedDate: new Date().toISOString(),
    modifiedBy: 'demo@gocrisp.com',
  };
  suppliers = suppliers.map((s, i) => (i === idx ? updated : s));
  return { ...updated };
}

export async function deleteSupplier(id: string): Promise<void> {
  await randomDelay();
  suppliers = suppliers.filter((s) => s.supplierUid !== id);
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

let _simulateOrderError = false;

export function setSimulateOrderError(flag: boolean) {
  _simulateOrderError = flag;
}

export async function fetchOrders(): Promise<OrderBrowseRow[]> {
  await randomDelay();
  if (_simulateOrderError) {
    _simulateOrderError = false;
    throw new Error(
      'Network error: Unable to reach the order service (ECONNREFUSED). Please check your connection and try again.'
    );
  }
  return mockOrders.map((o) => ({ ...o }));
}

// ---------------------------------------------------------------------------
// Incoming Data
// ---------------------------------------------------------------------------

export async function fetchIncomingData(filters?: {
  clientShortCode?: string;
  retailerShortCode?: string;
  supplierShortCode?: string;
  source?: string;
  payloadType?: string;
  status?: string;
}): Promise<DataRecord[]> {
  await randomDelay();
  let results = mockIncomingData.map((r) => ({ ...r }));

  if (filters) {
    if (filters.clientShortCode) {
      results = results.filter((r) => r.clientShortCode === filters.clientShortCode);
    }
    if (filters.retailerShortCode) {
      results = results.filter((r) => r.retailerShortCode === filters.retailerShortCode);
    }
    if (filters.supplierShortCode) {
      results = results.filter((r) => r.supplierShortCode === filters.supplierShortCode);
    }
    if (filters.source) {
      results = results.filter((r) => r.source === filters.source);
    }
    if (filters.payloadType) {
      results = results.filter((r) => r.payloadType === filters.payloadType);
    }
    if (filters.status) {
      results = results.filter((r) => r.status === filters.status);
    }
  }

  return results;
}

export async function fetchClientList(): Promise<
  { clientUid: string; clientName: string; clientShortCode: string }[]
> {
  await randomDelay();
  return mockClients.map((c) => ({ ...c }));
}

export async function fetchRetailerList(): Promise<{ name: string; shortCode: string }[]> {
  await randomDelay();
  return mockRetailerOptions.map((r) => ({ ...r }));
}

export async function fetchSupplierList(): Promise<{ name: string; shortCode: string }[]> {
  await randomDelay();
  return mockSupplierOptions.map((s) => ({ ...s }));
}

export async function reprocessRecord(
  uid: string,
): Promise<{ success: boolean; status: string; message: string }> {
  await delay(500 + Math.random() * 300);
  const record = mockIncomingData.find((r) => r.dataInUid === uid);
  if (!record) {
    return { success: false, status: 'Error', message: `Record ${uid} not found` };
  }
  return {
    success: true,
    status: 'Processing',
    message: `Record ${uid} has been queued for reprocessing`,
  };
}

export async function requeueRecord(
  uid: string,
): Promise<{ success: boolean; message: string }> {
  await delay(400 + Math.random() * 400);
  const record = mockIncomingData.find((r) => r.dataInUid === uid);
  if (!record) {
    return { success: false, message: `Record ${uid} not found` };
  }
  return { success: true, message: `Record ${uid} has been requeued successfully` };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function fetchUsers(): Promise<User[]> {
  await randomDelay();
  return mockUsers.map((u) => ({ ...u }));
}

// ---------------------------------------------------------------------------
// Retailers
// ---------------------------------------------------------------------------

export async function fetchRetailers(): Promise<Retailer[]> {
  await randomDelay();
  return mockRetailers.map((r) => ({ ...r }));
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function fetchProducts(): Promise<Product[]> {
  await randomDelay();
  return products.map((p) => ({ ...p }));
}

function normalizeVariants(
  rows: CreateProductRequest['variants'],
): import('../types/products').ProductVariant[] {
  return (rows ?? []).map((v) => ({
    id: v.id && v.id.trim() ? v.id : generateUuid(),
    sku: v.sku,
    model: v.model?.trim() || undefined,
    upc: v.upc ?? '',
    ean: v.ean ?? '',
    gtin: v.gtin ?? '',
    size: v.size,
    colour: v.colour,
    style: v.style,
    description: v.description,
    basePrice: v.basePrice ?? null,
    listPrice: v.listPrice ?? null,
    activeYn: v.activeYn ?? 'Y',
  }));
}

export async function createProduct(data: CreateProductRequest): Promise<Product> {
  await randomDelay();
  const now = new Date().toISOString();
  const id = generateUuid();
  const primaryVariantModel = data.variants?.map((v) => v.model?.trim()).find(Boolean) ?? '';
  const row: Product = {
    id,
    displayName: data.displayName.trim(),
    parentProductId: data.parentProductId?.trim() || id,
    variantDimensions: data.variantDimensions ?? { size: true, colour: true, style: true },
    supplierUid: data.supplierUid,
    retailerUid: data.retailerUid,
    departmentUid: data.departmentUid ?? null,
    classUid: data.classUid ?? null,
    subclassUid: data.subclassUid ?? null,
    categoryUid: data.categoryUid ?? null,
    subcategoryUid: data.subcategoryUid ?? null,
    model: data.model?.trim() || primaryVariantModel || undefined,
    sku: data.sku?.trim() ?? '',
    upc: data.upc ?? '',
    ean: data.ean ?? '',
    gtin: data.gtin ?? '',
    description: data.description ?? '',
    variants: normalizeVariants(data.variants),
    basePrice: data.basePrice ?? null,
    listPrice: data.listPrice ?? null,
    priceBy: data.priceBy ?? 'UNIT',
    weightUom: data.weightUom ?? 'LB',
    weight: data.weight ?? null,
    dimensionUom: data.dimensionUom ?? 'IN',
    unitLength: data.unitLength ?? null,
    unitWidth: data.unitWidth ?? null,
    unitHeight: data.unitHeight ?? null,
    casePack: data.casePack ?? null,
    uom: data.uom ?? 'EA',
    activeYn: data.activeYn ?? 'Y',
    createdDate: now,
    createdBy: data.createdBy ?? 'demo@gocrisp.com',
    source: data.source ?? 'UI',
    modifiedDate: now,
    modifiedBy: data.modifiedBy ?? 'demo@gocrisp.com',
    deletedYn: data.deletedYn ?? 'N',
  };
  products = [...products, row];
  return { ...row, variants: row.variants.map((v) => ({ ...v })) };
}

export async function updateProduct(data: UpdateProductRequest): Promise<Product> {
  await randomDelay();
  const idx = products.findIndex((p) => p.id === data.id);
  if (idx === -1) throw new Error(`Product ${data.id} not found`);
  const prev = products[idx];
  const now = new Date().toISOString();
  const primaryVariantModel = data.variants?.map((v) => v.model?.trim()).find(Boolean) ?? '';
  const updated: Product = {
    ...prev,
    displayName: data.displayName.trim(),
    parentProductId: data.parentProductId?.trim() || prev.parentProductId || data.id,
    variantDimensions: data.variantDimensions ?? prev.variantDimensions ?? { size: true, colour: true, style: true },
    supplierUid: data.supplierUid,
    retailerUid: data.retailerUid,
    departmentUid: data.departmentUid ?? null,
    classUid: data.classUid ?? null,
    subclassUid: data.subclassUid ?? null,
    categoryUid: data.categoryUid ?? null,
    subcategoryUid: data.subcategoryUid ?? null,
    model: data.model?.trim() || primaryVariantModel || prev.model,
    sku: data.sku?.trim() ?? '',
    upc: data.upc ?? '',
    ean: data.ean ?? '',
    gtin: data.gtin ?? '',
    description: data.description ?? '',
    variants: normalizeVariants(data.variants),
    basePrice: data.basePrice ?? null,
    listPrice: data.listPrice ?? null,
    priceBy: data.priceBy ?? 'UNIT',
    weightUom: data.weightUom ?? 'LB',
    weight: data.weight ?? null,
    dimensionUom: data.dimensionUom ?? 'IN',
    unitLength: data.unitLength ?? null,
    unitWidth: data.unitWidth ?? null,
    unitHeight: data.unitHeight ?? null,
    casePack: data.casePack ?? null,
    uom: data.uom ?? 'EA',
    activeYn: data.activeYn ?? 'Y',
    modifiedDate: now,
    modifiedBy: data.modifiedBy ?? 'demo@gocrisp.com',
    deletedYn: data.deletedYn ?? 'N',
  };
  products = products.map((p, i) => (i === idx ? updated : p));
  return { ...updated, variants: updated.variants.map((v) => ({ ...v })) };
}

export async function deleteProductVariant(productId: string, variantId: string): Promise<Product> {
  await randomDelay();
  const idx = products.findIndex((p) => p.id === productId);
  if (idx === -1) throw new Error(`Product ${productId} not found`);
  const prev = products[idx];
  const nextVariants = prev.variants.filter((v) => v.id !== variantId);
  if (nextVariants.length === 0) {
    throw new Error('A logical product must have at least one SKU variant.');
  }
  const updated: Product = {
    ...prev,
    variants: nextVariants,
    modifiedDate: new Date().toISOString(),
    modifiedBy: 'demo@gocrisp.com',
  };
  products = products.map((p, i) => (i === idx ? updated : p));
  return { ...updated, variants: updated.variants.map((v) => ({ ...v })) };
}

export async function deleteProduct(id: string): Promise<void> {
  await randomDelay();
  products = products.filter((p) => p.id !== id);
}

export async function fetchDepartments(
  _clientShortCode: string,
  retailerUid?: string,
): Promise<Department[]> {
  await randomDelay();
  let rows = mockDepartments;
  if (retailerUid) rows = rows.filter((d) => d.retailerUid === retailerUid);
  return rows.map((d) => ({ ...d }));
}

export async function fetchClasses(
  _clientShortCode: string,
  retailerUid?: string,
  departmentUid?: string,
): Promise<DepartmentClass[]> {
  await randomDelay();
  let rows = mockDepartmentClasses;
  if (retailerUid) rows = rows.filter((c) => c.retailerUid === retailerUid);
  if (departmentUid) rows = rows.filter((c) => c.departmentUid === departmentUid);
  return rows.map((c) => ({ ...c }));
}

export async function fetchSubclasses(
  _clientShortCode: string,
  retailerUid?: string,
  classUid?: string,
): Promise<Subclass[]> {
  await randomDelay();
  let rows = mockSubclasses;
  if (retailerUid) rows = rows.filter((s) => s.retailerUid === retailerUid);
  if (classUid) rows = rows.filter((s) => s.classUid === classUid);
  return rows.map((s) => ({ ...s }));
}

export async function fetchCategories(
  _clientShortCode: string,
  _supplierUid?: string,
): Promise<Category[]> {
  await randomDelay();
  let rows = mockCategories;
  if (_supplierUid) rows = rows.filter((c) => c.supplierUid === _supplierUid);
  return rows.map((c) => ({ ...c }));
}

export async function fetchSubcategories(
  _clientShortCode: string,
  _supplierUid?: string,
): Promise<Subcategory[]> {
  await randomDelay();
  let rows = mockSubcategories;
  if (_supplierUid) rows = rows.filter((s) => s.supplierUid === _supplierUid);
  return rows.map((s) => ({ ...s }));
}
