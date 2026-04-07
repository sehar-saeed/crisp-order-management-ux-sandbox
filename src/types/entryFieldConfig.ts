/**
 * Configuration-driven field definitions for Order Entry screens.
 *
 * Follows the same three-layer pattern as Order Browse:
 *   master_entry_fields  →  client overrides  →  resolved at runtime
 *
 * Two independent config sets share the same types:
 *   - "header" fields  (order-level: PO number, dates, addresses, etc.)
 *   - "txn"    columns (item-transaction table: qty, UOM, price, etc.)
 */

export type EntryFieldType =
  | 'text'
  | 'date'
  | 'toggle'
  | 'select'
  | 'address'
  | 'party_select'
  | 'order_type'
  | 'number'
  | 'currency';

export type EntryFieldScope = 'header' | 'txn';

/**
 * A row in the **master_entry_fields** control table.
 * System-defined. Clients cannot add or remove fields.
 */
export interface MasterEntryField {
  field_id: string;
  scope: EntryFieldScope;
  caption: string;
  field_type: EntryFieldType;
  /** Structural fields (order_type, parties) can never be hidden. */
  allow_hide: boolean;
  default_visible: boolean;
  default_sequence: number;
}

/**
 * A row in the **custom_entry_fields** client table.
 * Sparse: only overridden values are stored.
 *
 * Currently mocked with localStorage as a stand-in for API persistence.
 */
export interface ClientEntryOverride {
  field_id: string;
  visible?: boolean;
  sequence?: number;
  caption?: string;
}

/**
 * Merged result of master + client overrides.
 * Computed at runtime — never persisted.
 */
export interface ResolvedEntryField {
  field_id: string;
  scope: EntryFieldScope;
  caption: string;
  field_type: EntryFieldType;
  allow_hide: boolean;
  visible: boolean;
  sequence: number;
  has_override: boolean;
}
