import type { MasterEntryField } from '../../types/entryFieldConfig';

/**
 * Master field definitions for the **Order Entry / Edit header**.
 *
 * SOURCE OF TRUTH — fields are drawn from:
 *   1. OrderBrowseRow  (src/types/order.ts)  — the backend data model
 *   2. ORDER_TYPES     (src/types/orderEntry.ts) — structural entry fields
 *   3. Standard B2B order-management fields   — marked [ASSUMED] below
 *
 * Fields with `allow_hide: false` are structural — they drive the form
 * flow (order type determines parties, parties determine addresses).
 * Users can rename captions and reorder, but cannot hide them.
 */
export const masterHeaderFields: MasterEntryField[] = [
  /* ═══ Structural / core fields (not hideable) ═══ */
  {
    field_id: 'order_type',
    scope: 'header',
    caption: 'Order Type',
    field_type: 'order_type',
    allow_hide: false,
    default_visible: true,
    default_sequence: 0,
  },
  {
    field_id: 'from_party',
    scope: 'header',
    caption: 'From',
    field_type: 'party_select',
    allow_hide: false,
    default_visible: true,
    default_sequence: 1,
  },
  {
    field_id: 'to_party',
    scope: 'header',
    caption: 'To',
    field_type: 'party_select',
    allow_hide: false,
    default_visible: true,
    default_sequence: 2,
  },
  {
    field_id: 'po_number',
    scope: 'header',
    caption: 'PO Number',
    field_type: 'text',
    allow_hide: false,
    default_visible: true,
    default_sequence: 3,
  },
  {
    field_id: 'po_date',
    scope: 'header',
    caption: 'PO Date',
    field_type: 'date',
    allow_hide: true,
    default_visible: true,
    default_sequence: 4,
  },
  {
    field_id: 'test_order',
    scope: 'header',
    caption: 'Test Order',
    field_type: 'toggle',
    allow_hide: true,
    default_visible: true,
    default_sequence: 5,
  },

  /* ═══ Address fields ═══ */
  {
    field_id: 'bill_to',
    scope: 'header',
    caption: 'Bill To',
    field_type: 'address',
    allow_hide: true,
    default_visible: true,
    default_sequence: 6,
  },
  {
    field_id: 'ship_to',
    scope: 'header',
    caption: 'Ship To',
    field_type: 'address',
    allow_hide: true,
    default_visible: true,
    default_sequence: 7,
  },

  /* ═══ Date fields — from OrderBrowseRow / txn rollup ═══ */
  {
    field_id: 'ship_date',
    scope: 'header',
    caption: 'Ship Date',
    field_type: 'date',
    allow_hide: true,
    default_visible: true,
    default_sequence: 8,
  },
  {
    field_id: 'cancel_date',
    scope: 'header',
    caption: 'Cancel Date',
    field_type: 'date',
    allow_hide: true,
    default_visible: true,
    default_sequence: 9,
  },

  /* ═══ Status fields — from OrderBrowseRow ═══ */
  {
    field_id: 'invoice_status',
    scope: 'header',
    caption: 'Invoice Status',
    field_type: 'status',
    allow_hide: true,
    default_visible: true,
    default_sequence: 10,
  },
  {
    field_id: 'shipment_status',
    scope: 'header',
    caption: 'Shipment Status',
    field_type: 'status',
    allow_hide: true,
    default_visible: true,
    default_sequence: 11,
  },
  {
    field_id: 'comm_status',
    scope: 'header',
    caption: 'Commission Status',
    field_type: 'status',
    allow_hide: true,
    default_visible: true,
    default_sequence: 12,
  },

  /* ═══ Calculated / summary fields — from OrderBrowseRow ═══ */
  {
    field_id: 'total_amount',
    scope: 'header',
    caption: 'Total Amount',
    field_type: 'currency',
    allow_hide: true,
    default_visible: true,
    default_sequence: 13,
  },
  {
    field_id: 'item_count',
    scope: 'header',
    caption: 'Line Item Count',
    field_type: 'readonly',
    allow_hide: true,
    default_visible: true,
    default_sequence: 14,
  },

  /* ═══ Standard B2B order fields [ASSUMED] ═══
   * These are standard fields in B2B order management systems that
   * are not explicitly modeled in OrderBrowseRow but are expected
   * in a complete header field set. Marked as assumptions.
   */
  {
    field_id: 'currency',
    scope: 'header',
    caption: 'Currency',
    field_type: 'text',
    allow_hide: true,
    default_visible: true,
    default_sequence: 15,
  },
  {
    field_id: 'payment_terms',
    scope: 'header',
    caption: 'Payment Terms',
    field_type: 'text',
    allow_hide: true,
    default_visible: true,
    default_sequence: 16,
  },
  {
    field_id: 'department',
    scope: 'header',
    caption: 'Department',
    field_type: 'text',
    allow_hide: true,
    default_visible: true,
    default_sequence: 17,
  },
  {
    field_id: 'division',
    scope: 'header',
    caption: 'Division',
    field_type: 'text',
    allow_hide: true,
    default_visible: false,
    default_sequence: 18,
  },
  {
    field_id: 'buyer_ref',
    scope: 'header',
    caption: 'Buyer Reference',
    field_type: 'text',
    allow_hide: true,
    default_visible: true,
    default_sequence: 19,
  },
  {
    field_id: 'vendor_ref',
    scope: 'header',
    caption: 'Vendor Reference',
    field_type: 'text',
    allow_hide: true,
    default_visible: true,
    default_sequence: 20,
  },
  {
    field_id: 'special_instructions',
    scope: 'header',
    caption: 'Special Instructions',
    field_type: 'text',
    allow_hide: true,
    default_visible: true,
    default_sequence: 21,
  },
  {
    field_id: 'fob',
    scope: 'header',
    caption: 'FOB Point',
    field_type: 'text',
    allow_hide: true,
    default_visible: false,
    default_sequence: 22,
  },
  {
    field_id: 'carrier',
    scope: 'header',
    caption: 'Carrier / Ship Via',
    field_type: 'text',
    allow_hide: true,
    default_visible: true,
    default_sequence: 23,
  },
  {
    field_id: 'warehouse',
    scope: 'header',
    caption: 'Warehouse',
    field_type: 'text',
    allow_hide: true,
    default_visible: false,
    default_sequence: 24,
  },
];

/**
 * Master column definitions for the **Item Transaction table**.
 *
 * These mirror the transaction table columns. Extended is always visible
 * (computed, not hideable).
 */
export const masterTxnColumns: MasterEntryField[] = [
  {
    field_id: 'txn_qty',
    scope: 'txn',
    caption: 'Qty',
    field_type: 'number',
    allow_hide: false,
    default_visible: true,
    default_sequence: 0,
  },
  {
    field_id: 'txn_uom',
    scope: 'txn',
    caption: 'UOM',
    field_type: 'select',
    allow_hide: true,
    default_visible: true,
    default_sequence: 1,
  },
  {
    field_id: 'txn_unit_price',
    scope: 'txn',
    caption: 'Unit Price',
    field_type: 'currency',
    allow_hide: false,
    default_visible: true,
    default_sequence: 2,
  },
  {
    field_id: 'txn_store',
    scope: 'txn',
    caption: 'Store #',
    field_type: 'text',
    allow_hide: true,
    default_visible: true,
    default_sequence: 3,
  },
  {
    field_id: 'txn_ship_date',
    scope: 'txn',
    caption: 'Ship Date',
    field_type: 'date',
    allow_hide: true,
    default_visible: true,
    default_sequence: 4,
  },
  {
    field_id: 'txn_cancel_date',
    scope: 'txn',
    caption: 'Cancel Date',
    field_type: 'date',
    allow_hide: true,
    default_visible: true,
    default_sequence: 5,
  },
  {
    field_id: 'txn_extended',
    scope: 'txn',
    caption: 'Extended',
    field_type: 'currency',
    allow_hide: false,
    default_visible: true,
    default_sequence: 6,
  },
];
