import type { MasterEntryField } from '../../types/entryFieldConfig';

/**
 * Master field definitions for the **Order Entry header**.
 *
 * Fields with `allow_hide: false` are structural — they drive the
 * form flow (order type determines parties, parties determine addresses).
 * Users can rename their captions and reorder them, but cannot hide them.
 */
export const masterHeaderFields: MasterEntryField[] = [
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
