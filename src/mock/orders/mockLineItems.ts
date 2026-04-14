export interface OrderLineItem {
  id: string;
  lineNumber: number;
  upc: string;
  description: string;
  quantity: number;
  unitPrice: number;
  extendedPrice: number;
  unitOfMeasure: string;
}

export type HistorySource = 'manual' | 'edi' | 'upload' | 'system';

export interface OrderHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  detail: string;
  /** How this change originated. */
  source: HistorySource;
  /** Optional: which field or area was affected. */
  field?: string;
  /** Optional: previous value for field-level changes. */
  oldValue?: string;
  /** Optional: new value for field-level changes. */
  newValue?: string;
}

const products = [
  { upc: '049000042566', desc: 'Organic Green Tea 16oz' },
  { upc: '038000138416', desc: 'Whole Grain Cereal 18oz' },
  { upc: '028400090766', desc: 'Sea Salt Kettle Chips 8oz' },
  { upc: '041196021301', desc: 'Extra Virgin Olive Oil 500ml' },
  { upc: '072036700025', desc: 'Wild Caught Salmon Fillets 12oz' },
  { upc: '038000596728', desc: 'Peanut Butter Crunchy 16oz' },
  { upc: '011110038364', desc: 'Greek Yogurt Vanilla 32oz' },
  { upc: '041290048254', desc: 'Sparkling Water Lime 12pk' },
  { upc: '021130126026', desc: 'Organic Baby Spinach 5oz' },
  { upc: '044000032135', desc: 'Dark Chocolate Bar 3.5oz' },
  { upc: '070038611271', desc: 'Aged Cheddar Cheese 8oz' },
  { upc: '021000042524', desc: 'Stone Ground Mustard 8oz' },
];

const units = ['CS', 'EA', 'PK', 'DZ', 'LB'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateLineItems(orderId: string): OrderLineItem[] {
  const seed = orderId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = seededRandom(seed);
  const count = 3 + Math.floor(rng() * 8);
  const items: OrderLineItem[] = [];

  for (let i = 0; i < count; i++) {
    const product = products[Math.floor(rng() * products.length)];
    const qty = 1 + Math.floor(rng() * 200);
    const price = Math.round((1.5 + rng() * 48.5) * 100) / 100;

    items.push({
      id: `li-${orderId}-${i + 1}`,
      lineNumber: i + 1,
      upc: product.upc,
      description: product.desc,
      quantity: qty,
      unitPrice: price,
      extendedPrice: Math.round(qty * price * 100) / 100,
      unitOfMeasure: units[Math.floor(rng() * units.length)],
    });
  }

  return items;
}

interface HistoryTemplate {
  action: string;
  detail: string;
  source: HistorySource;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

export function generateOrderHistory(orderId: string, orderDate: string): OrderHistoryEntry[] {
  const seed = orderId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + 999;
  const rng = seededRandom(seed);

  const base = new Date(orderDate);
  const entries: OrderHistoryEntry[] = [];
  const manualUsers = ['jsmith@acme.com', 'mwilson@acme.com', 'agarcia@acme.com'];

  const templates: HistoryTemplate[] = [
    {
      action: 'Order Created',
      detail: 'Purchase order received via EDI 850',
      source: 'edi',
    },
    {
      action: 'Order Acknowledged',
      detail: 'Acknowledgment sent via EDI 855',
      source: 'edi',
    },
    {
      action: 'Ship Date Changed',
      detail: 'Ship date updated by user',
      source: 'manual',
      field: 'Ship Date',
      oldValue: '2025-03-15',
      newValue: '2025-03-22',
    },
    {
      action: 'Line Item Qty Modified',
      detail: 'Quantity adjusted for line #2',
      source: 'manual',
      field: 'Line #2 Qty',
      oldValue: '48',
      newValue: '60',
    },
    {
      action: 'Price List Upload',
      detail: 'Bulk price update applied from uploaded CSV',
      source: 'upload',
    },
    {
      action: 'Shipment Created',
      detail: 'ASN generated, tracking assigned',
      source: 'system',
    },
    {
      action: 'Invoice Generated',
      detail: 'EDI 810 invoice created',
      source: 'edi',
    },
    {
      action: 'Discount Added',
      detail: 'Header-level early payment discount applied',
      source: 'manual',
      field: 'Header Discount',
      oldValue: '—',
      newValue: '2% / $340.00',
    },
    {
      action: 'EDI 860 Change',
      detail: 'PO change received — added 2 line items',
      source: 'edi',
    },
    {
      action: 'Overwrite from Upload',
      detail: 'Store allocations replaced from retailer spreadsheet',
      source: 'upload',
    },
    {
      action: 'Rep Split Adjusted',
      detail: 'Sales split updated from 60/40 to 50/50',
      source: 'manual',
      field: 'Rep Splits',
      oldValue: '60% / 40%',
      newValue: '50% / 50%',
    },
    {
      action: 'Invoice Submitted',
      detail: 'Invoice transmitted to retailer',
      source: 'edi',
    },
    {
      action: 'Status Update',
      detail: 'Invoice status moved to Submitted',
      source: 'system',
    },
  ];

  const count = 6 + Math.floor(rng() * 6);
  const used = new Set<number>();

  for (let i = 0; i < count && used.size < templates.length; i++) {
    let idx: number;
    do {
      idx = Math.floor(rng() * templates.length);
    } while (used.has(idx));
    used.add(idx);
  }

  const selectedIndices = Array.from(used).sort((a, b) => a - b);

  for (let i = 0; i < selectedIndices.length; i++) {
    const tmpl = templates[selectedIndices[i]];
    const ts = new Date(base);
    ts.setDate(base.getDate() + i);
    ts.setHours(7 + Math.floor(rng() * 11), Math.floor(rng() * 60));

    const user = tmpl.source === 'system' ? 'system' :
                 tmpl.source === 'edi' ? 'edi-gateway' :
                 tmpl.source === 'upload' ? manualUsers[Math.floor(rng() * manualUsers.length)] :
                 manualUsers[Math.floor(rng() * manualUsers.length)];

    entries.push({
      id: `hist-${orderId}-${i}`,
      timestamp: ts.toISOString(),
      action: tmpl.action,
      user,
      detail: tmpl.detail,
      source: tmpl.source,
      field: tmpl.field,
      oldValue: tmpl.oldValue,
      newValue: tmpl.newValue,
    });
  }

  return entries;
}

/**
 * Generates a short mock history for a new/unsaved order.
 * Represents the initial creation activity before the order is persisted.
 */
export function generateNewOrderHistory(): OrderHistoryEntry[] {
  const now = new Date();
  return [
    {
      id: 'hist-new-0',
      timestamp: new Date(now.getTime() - 120_000).toISOString(),
      action: 'Order Draft Started',
      user: 'current-user@acme.com',
      detail: 'New order entry form opened',
      source: 'system',
    },
    {
      id: 'hist-new-1',
      timestamp: now.toISOString(),
      action: 'Editing in Progress',
      user: 'current-user@acme.com',
      detail: 'Unsaved changes — order has not been submitted',
      source: 'manual',
    },
  ];
}
