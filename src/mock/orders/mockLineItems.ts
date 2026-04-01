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

export interface OrderHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  detail: string;
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

export function generateOrderHistory(orderId: string, orderDate: string): OrderHistoryEntry[] {
  const seed = orderId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + 999;
  const rng = seededRandom(seed);

  const base = new Date(orderDate);
  const entries: OrderHistoryEntry[] = [];
  const users = ['system', 'jsmith@acme.com', 'mwilson@acme.com', 'agarcia@acme.com'];

  const events = [
    { action: 'Order Created', detail: 'Purchase order received via EDI 850' },
    { action: 'Order Acknowledged', detail: 'Acknowledgment sent via EDI 855' },
    { action: 'Shipment Created', detail: 'ASN generated, tracking assigned' },
    { action: 'Invoice Generated', detail: 'EDI 810 invoice created' },
    { action: 'Invoice Submitted', detail: 'Invoice transmitted to retailer' },
  ];

  for (let i = 0; i < events.length; i++) {
    const ts = new Date(base);
    ts.setHours(8 + Math.floor(rng() * 10), Math.floor(rng() * 60));
    ts.setDate(base.getDate() + i);

    entries.push({
      id: `hist-${orderId}-${i}`,
      timestamp: ts.toISOString(),
      action: events[i].action,
      user: users[Math.floor(rng() * users.length)],
      detail: events[i].detail,
    });
  }

  return entries;
}
