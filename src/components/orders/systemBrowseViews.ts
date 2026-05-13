import type { OrderBrowseRow } from '../../types/order';

export type SystemBrowseViewId =
  | 'all'
  | 'processing'
  | 'exceptions'
  | 'failed_imports'
  | 'draft'
  | 'completed';

export const SYSTEM_BROWSE_VIEW_OPTIONS: { id: SystemBrowseViewId; label: string }[] = [
  { id: 'all', label: 'All Orders' },
  { id: 'processing', label: 'Processing' },
  { id: 'exceptions', label: 'Exceptions' },
  { id: 'failed_imports', label: 'Failed Imports' },
  { id: 'draft', label: 'Draft / Test' },
  { id: 'completed', label: 'Completed' },
];

const VIEW_IDS = new Set<SystemBrowseViewId>(SYSTEM_BROWSE_VIEW_OPTIONS.map((o) => o.id));

export function parseSystemBrowseView(raw: string | null): SystemBrowseViewId {
  if (raw && VIEW_IDS.has(raw as SystemBrowseViewId)) {
    return raw as SystemBrowseViewId;
  }
  return 'all';
}

export function systemViewIsIngestion(view: SystemBrowseViewId): boolean {
  return view === 'failed_imports';
}

/** Order-browse rows only (not used for failed_imports). */
export function applySystemViewToOrders(
  orders: OrderBrowseRow[],
  view: SystemBrowseViewId,
): OrderBrowseRow[] {
  if (view === 'failed_imports') return [];

  if (view === 'all') return orders;

  if (view === 'completed') {
    return orders.filter(
      (o) => o.invoiceStatus === 'Invoiced' && o.shipmentStatus === 'Shipped',
    );
  }

  if (view === 'processing') {
    return orders.filter(
      (o) =>
        o.shipmentStatus === 'Processing'
        || (o.commStatus === 'Sent'
          && o.shipmentStatus !== 'Shipped'
          && o.shipmentStatus !== 'Cancelled'),
    );
  }

  if (view === 'exceptions') {
    return orders.filter(
      (o) =>
        o.invoiceStatus === 'Cancelled'
        || o.shipmentStatus === 'Cancelled'
        || o.commStatus === 'Cancelled',
    );
  }

  if (view === 'draft') {
    return orders.filter(
      (o) =>
        (o.commStatus === 'Pending' && o.invoiceStatus === 'Open')
        || (o.shipmentStatus === 'Pending' && o.invoiceStatus === 'Open'),
    );
  }

  return orders;
}
