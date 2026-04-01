/**
 * Backend grid contract types.
 *
 * These types model the shape of data as delivered by the backend API:
 *   - GridColumnDef[]: ordered column metadata (the "grid definition")
 *   - GridRow[]:       positional row data (the "row payload")
 *
 * The UX layer receives this payload and renders the grid by aligning
 * each GridColumnDef to the corresponding Cols[index] in each GridRow.
 * Column property-name lookups are never used at the rendering layer.
 */

/**
 * A single column in the grid definition delivered by the backend.
 *
 * When `table_name` is empty the field is a **calculated field** —
 * its value is derived by the backend (e.g. a SUM across line items)
 * rather than being a direct database column.
 */
export interface GridColumnDef {
  caption: string;
  width: number;
  table_name: string;
  column_name: string;
  data_type: string;
  number_format: string;
  decimal_places: number;
  display_style: string;
}

/**
 * A single row as delivered by the backend.
 * Values are positional — Cols[i] corresponds to GridColumnDef[i].
 */
export interface GridRow {
  Cols: any[];
}

/**
 * The complete grid payload from the backend.
 *
 * `rowIds` is a parallel array that maps each row index to a unique
 * identifier (typically the primary key).  This is separate from the
 * column data because the ID may not be a visible grid column.
 */
export interface GridPayload {
  columns: GridColumnDef[];
  rows: GridRow[];
  rowIds: string[];
}
