export type DataType = 'string' | 'number' | 'date';
export type NumberFormat = '' | 'dollars' | 'number' | 'percent';
export type DisplayStyle = 'default' | 'status_badge';

/**
 * A row in the **master_custom_browse** control table.
 *
 * System-defined and read-only at the client level.
 * Defines every field that CAN appear in a browse grid.
 * Clients cannot add or remove fields — only override display properties
 * via the custom_browse table.
 */
export interface MasterBrowseField {
  field_id: string;
  caption: string;
  table_name: string;
  column_name: string;
  data_type: DataType;
  number_format: NumberFormat;
  decimal_places: number;
  display_style: DisplayStyle;
  default_width_px: number;
  default_visible: boolean;
  default_sequence: number;
}

/**
 * A row in the **custom_browse** client table.
 *
 * Each property is optional — only overridden values are stored.
 * Absence of a property means "use the master default."
 *
 * In production this is persisted by the backend API.
 * Currently mocked with localStorage as a stand-in for API persistence.
 */
export interface ClientBrowseOverride {
  field_id: string;
  visible?: boolean;
  sequence?: number;
  caption?: string;
  width_px?: number;
  number_format?: NumberFormat;
  decimal_places?: number;
}

/**
 * The merged result of master_custom_browse + custom_browse.
 * This is what the grid renders from.
 * Never persisted — always computed at runtime by resolveColumns().
 *
 * `has_override` is true only when one or more resolved values
 * actually differ from the master defaults (not merely because an
 * override entry exists).
 */
export interface ResolvedBrowseColumn {
  field_id: string;
  caption: string;
  table_name: string;
  column_name: string;
  data_type: DataType;
  number_format: NumberFormat;
  decimal_places: number;
  display_style: DisplayStyle;
  width_px: number;
  visible: boolean;
  sequence: number;
  has_override: boolean;
}
