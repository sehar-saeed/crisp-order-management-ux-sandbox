/**
 * Order types determine the document flow direction
 * and which party is sender vs receiver.
 *
 *   PO / Return Auth:   Retailer (from) → Supplier (to)
 *   Invoice / Credit:   Supplier (from) → Retailer (to)
 */
export type OrderType = 'purchase_order' | 'return_auth' | 'invoice' | 'credit_memo';

export interface OrderTypeOption {
  value: OrderType;
  label: string;
  description: string;
  fromLabel: string;
  toLabel: string;
}

export const ORDER_TYPES: OrderTypeOption[] = [
  {
    value: 'purchase_order',
    label: 'Purchase Order',
    description: 'Retailer orders goods from supplier',
    fromLabel: 'Retailer (Buyer)',
    toLabel: 'Supplier (Vendor)',
  },
  {
    value: 'return_auth',
    label: 'Return Authorization',
    description: 'Retailer returns goods to supplier',
    fromLabel: 'Retailer (Originator)',
    toLabel: 'Supplier (Receiver)',
  },
  {
    value: 'invoice',
    label: 'Invoice',
    description: 'Supplier bills retailer for shipped goods',
    fromLabel: 'Supplier (Biller)',
    toLabel: 'Retailer (Payer)',
  },
  {
    value: 'credit_memo',
    label: 'Credit Memo',
    description: 'Supplier issues credit to retailer',
    fromLabel: 'Supplier (Issuer)',
    toLabel: 'Retailer (Recipient)',
  },
];

export interface Address {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
}

export const EMPTY_ADDRESS: Address = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: '',
};

export interface MockParty {
  id: string;
  name: string;
  shortCode: string;
  billToAddress: Address;
  locations: { id: string; name: string; address: Address }[];
}

/* ── Rep Splits ── */

export interface MockRep {
  id: string;
  name: string;
  code: string;
}

export interface RepSplitRow {
  rep_id: string;
  sales_pct: number;
  comm_pct: number;
}

/**
 * Default split rules keyed by "retailerId::supplierId".
 * A key of "*::supplierId" means "any retailer with this supplier".
 * A key of "*::*" is the global fallback.
 */
export interface DefaultSplitRule {
  key: string;
  splits: RepSplitRow[];
}

/* ── Products & Order Items ── */

export interface MockProduct {
  id: string;
  upc: string;
  description: string;
  default_uom: string;
  default_price: number;
  category: string;
}

export const UOMS = ['EA', 'CS', 'PK', 'BX', 'DZ', 'LB', 'OZ', 'KG'] as const;
export type UOM = (typeof UOMS)[number];

export interface ItemTransaction {
  id: string;
  qty: number;
  uom: string;
  unit_price: number;
  store_number: string;
  ship_date: string;
  cancel_date: string;
}

export interface OrderItem {
  id: string;
  line_number: number;
  product_id: string;
  upc: string;
  description: string;
  transactions: ItemTransaction[];
}
