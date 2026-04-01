import type { SavedBrowseView } from '../../types/savedView';

/**
 * Seed data for the saved views system.
 * These ship as built-in examples so the feature isn't empty on first load.
 */
export const seedSavedViews: SavedBrowseView[] = [
  {
    view_id: 'view-compact',
    name: 'Compact Overview',
    owner: 'system',
    scope: 'shared',
    is_default: false,
    column_config: [
      { field_id: 'orderNumber', width_px: 110 },
      { field_id: 'retailerName', width_px: 130 },
      { field_id: 'totalAmount', width_px: 100 },
      { field_id: 'invoiceStatus', width_px: 90 },
      { field_id: 'shipmentStatus', visible: false },
      { field_id: 'orderDate', width_px: 95 },
      { field_id: 'itemCount', visible: false },
    ],
    created_at: '2025-12-01T10:00:00Z',
    updated_at: '2025-12-01T10:00:00Z',
  },
  {
    view_id: 'view-financial',
    name: 'Financial Review',
    owner: 'system',
    scope: 'shared',
    is_default: false,
    column_config: [
      { field_id: 'orderNumber' },
      { field_id: 'retailerName' },
      { field_id: 'totalAmount', width_px: 160, number_format: 'dollars', decimal_places: 2 },
      { field_id: 'invoiceStatus', sequence: 3 },
      { field_id: 'shipmentStatus', visible: false },
      { field_id: 'orderDate', sequence: 4 },
      { field_id: 'itemCount', visible: false },
    ],
    created_at: '2025-12-05T14:30:00Z',
    updated_at: '2025-12-05T14:30:00Z',
  },
  {
    view_id: 'view-shipping',
    name: 'Shipping Focus',
    owner: 'currentUser',
    scope: 'personal',
    is_default: false,
    column_config: [
      { field_id: 'orderNumber' },
      { field_id: 'retailerName' },
      { field_id: 'shipmentStatus', sequence: 2, width_px: 140 },
      { field_id: 'orderDate', sequence: 3 },
      { field_id: 'totalAmount', visible: false },
      { field_id: 'invoiceStatus', visible: false },
    ],
    created_at: '2026-01-10T09:15:00Z',
    updated_at: '2026-01-10T09:15:00Z',
  },
];
