import type { OrderBrowseRow } from '../../types/order';

const retailers = ['Walmart', 'Kroger', 'Target', 'Costco', 'Whole Foods', 'Safeway', 'Albertsons', 'Publix', 'H-E-B', 'Meijer'];
const suppliers = ['Acme Foods Corp', 'Pacific Produce Co', 'Mountain Valley Organics', 'Great Plains Meats', 'Coastal Seafood Inc', 'Golden Grain Distributors', 'Fresh Dairy Partners', 'Premier Beverage Co', 'Sunrise Bakery Ltd', 'Harvest Moon Farms'];
const invoiceStatuses = ['Invoiced', 'Open', 'Cancelled', 'Partial'];
const shipmentStatuses = ['Shipped', 'Pending', 'Processing', 'Cancelled', 'Delivered'];
const commStatuses = ['Acknowledged', 'Sent', 'Pending', 'Cancelled', 'Failed'];

function pad(n: number, len = 3): string {
  return String(n).padStart(len, '0');
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateOrders(count: number): OrderBrowseRow[] {
  const orders: OrderBrowseRow[] = [];
  const baseDate = new Date(2025, 0, 15);

  for (let i = 1; i <= count; i++) {
    const orderDate = new Date(baseDate);
    orderDate.setDate(baseDate.getDate() + i * 2);
    const shipDate = new Date(orderDate);
    shipDate.setDate(orderDate.getDate() + 3 + Math.floor(Math.random() * 5));

    const retailer = retailers[(i - 1) % retailers.length];
    const supplier = suppliers[(i + 3) % suppliers.length];
    const amount = Math.round((500 + Math.random() * 99500) * 100) / 100;

    orders.push({
      id: `ord-${pad(i, 8)}-aaaa-bbbb-cccc-${pad(i, 12)}`,
      orderNumber: `PO-2025-${pad(i)}`,
      retailerName: retailer,
      supplierName: supplier,
      orderDate: orderDate.toISOString().split('T')[0],
      shipDate: shipDate.toISOString().split('T')[0],
      invoiceStatus: i <= 15 ? invoiceStatuses[(i - 1) % invoiceStatuses.length] : randomFrom(invoiceStatuses),
      shipmentStatus: i <= 15 ? shipmentStatuses[(i - 1) % shipmentStatuses.length] : randomFrom(shipmentStatuses),
      commStatus: i <= 15 ? commStatuses[(i - 1) % commStatuses.length] : randomFrom(commStatuses),
      totalAmount: amount,
      itemCount: 3 + Math.floor(Math.random() * 150),
    });
  }
  return orders;
}

export const mockOrders: OrderBrowseRow[] = generateOrders(40);
