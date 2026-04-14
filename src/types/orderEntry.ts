/**
 * Order types available for New Order Entry.
 *
 * The original document-level types (invoice, credit_memo, return_auth)
 * are retained in the union for Order Edit backward compatibility but
 * are NOT shown in the New Order Entry type selector.
 */
export type OrderType =
  | 'purchase_order'
  | 'store_order'
  | 'replenishment'
  | 'gmm_mixed'
  | 'return_auth'
  | 'invoice'
  | 'credit_memo';

export type PartyKind = 'retailer' | 'supplier' | 'distributor' | 'store';

export interface OrderTypeOption {
  value: OrderType;
  label: string;
  /** Short "From → To" label for the segmented control. */
  segmentLabel: string;
  description: string;
  /** Party kind for the "from" selector. */
  fromKind: PartyKind;
  /** Party kind for the "to" selector. */
  toKind: PartyKind;
  fromLabel: string;
  toLabel: string;
  /** Fields visible for this type beyond the common set. */
  visibleFields: string[];
  /** Which fields are required for save validation. */
  requiredFields: string[];
  /** Whether this type requires rep splits to be valid. */
  requireRepSplits: boolean;
  /** Whether ship-to address/location is applicable. */
  showShipTo: boolean;
  /** Whether bill-to address is applicable. */
  showBillTo: boolean;
  /** When true, the type option is shown but not selectable (placeholder). */
  disabled?: boolean;
}

/**
 * Order types shown in the New Order Entry selector.
 *
 *   Purchase Order:   Retailer → Supplier  (primary)
 *   Store Order:      Store → Distributor   (store-level replenishment)
 *   Replenishment:    Distributor → Supplier (warehouse auto-replenishment)
 *   GMM / Mixed:      Placeholder — not selectable yet
 */
export const ORDER_TYPES: OrderTypeOption[] = [
  {
    value: 'purchase_order',
    label: 'Purchase Order',
    segmentLabel: 'Retailer \u2192 Vendor',
    description: 'Retailer orders goods from a supplier',
    fromKind: 'retailer',
    toKind: 'supplier',
    fromLabel: 'Retailer',
    toLabel: 'Vendor / Supplier',
    visibleFields: ['po_number', 'po_date', 'test_order', 'bill_to', 'ship_to'],
    requiredFields: ['from_party', 'to_party', 'po_number'],
    requireRepSplits: true,
    showShipTo: true,
    showBillTo: true,
  },
  {
    value: 'store_order',
    label: 'Store Order',
    segmentLabel: 'Store \u2192 Distributor',
    description: 'Store orders from a distributor warehouse',
    fromKind: 'store',
    toKind: 'distributor',
    fromLabel: 'Store',
    toLabel: 'Distributor',
    visibleFields: ['po_number', 'po_date', 'ship_to'],
    requiredFields: ['from_party', 'to_party', 'po_number'],
    requireRepSplits: false,
    showShipTo: true,
    showBillTo: false,
  },
  {
    value: 'replenishment',
    label: 'Replenishment',
    segmentLabel: 'Distributor \u2192 Vendor',
    description: 'Distributor reorders from a supplier',
    fromKind: 'distributor',
    toKind: 'supplier',
    fromLabel: 'Distributor',
    toLabel: 'Vendor / Supplier',
    visibleFields: ['po_number', 'po_date', 'ship_to'],
    requiredFields: ['from_party', 'to_party', 'po_number'],
    requireRepSplits: false,
    showShipTo: true,
    showBillTo: false,
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
