import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '../types/suppliers';
import { Retailer } from '../types/retailers';
import { OrderBrowseRow } from '../types/order';
import { DataRecord } from '../types/record';
import { User } from '../types/users';
import { mockSuppliers } from './data/suppliers';
import { mockRetailers } from './data/retailers';
import { mockOrders } from './orders/mockOrders';
import { mockIncomingData, mockClients, mockRetailerOptions, mockSupplierOptions } from './data/incomingData';
import { mockUsers } from './data/users';

let suppliers = [...mockSuppliers];

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
