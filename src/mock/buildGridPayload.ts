import type { ResolvedBrowseColumn } from '../types/browseConfig';
import type { GridColumnDef, GridRow, GridPayload } from '../types/gridContract';

/**
 * Simulates what the backend does when delivering a browse grid:
 *
 *   1. Accept the resolved column config (master + client overrides).
 *   2. Filter out columns the current user is not allowed to see
 *      (backend security — some field_ids may be excluded).
 *   3. Map resolved columns → GridColumnDef[] (backend contract format).
 *   4. Map keyed row objects → GridRow[] (positional Cols arrays,
 *      aligned to the delivered column order).
 *   5. Extract row IDs into a parallel array.
 *
 * In production this transformation happens server-side.
 * Here it runs client-side as a mock to prove the rendering layer
 * works with positional data, not property-name lookups.
 */

export interface BuildGridPayloadOptions {
  /** Property name in keyed rows that holds the unique row ID. */
  idField: string;
  /**
   * field_ids the current user is not authorized to see.
   * Simulates backend security filtering — excluded columns are
   * simply absent from the delivered grid definition.
   */
  excludedFieldIds?: string[];
}

/**
 * Mock security-excluded fields.
 * Toggle via setSecurityExcludedFields() for demo purposes.
 * In production, the backend would never send these columns.
 */
let _securityExcludedFields: string[] = [];

export function getSecurityExcludedFields(): readonly string[] {
  return _securityExcludedFields;
}

export function setSecurityExcludedFields(fieldIds: string[]): void {
  _securityExcludedFields = [...fieldIds];
}

export function buildGridPayload(
  resolvedColumns: ResolvedBrowseColumn[],
  keyedRows: Record<string, any>[],
  options: BuildGridPayloadOptions,
): GridPayload {
  let delivered = resolvedColumns.filter((c) => c.visible);

  const excluded = options.excludedFieldIds ?? _securityExcludedFields;
  if (excluded.length > 0) {
    const excludedSet = new Set(excluded);
    delivered = delivered.filter((c) => !excludedSet.has(c.field_id));
  }

  const columns: GridColumnDef[] = delivered.map((c) => ({
    caption: c.caption,
    width: c.width_px,
    table_name: c.table_name,
    column_name: c.column_name,
    data_type: c.data_type,
    number_format: c.number_format,
    decimal_places: c.decimal_places,
    display_style: c.display_style,
  }));

  const rows: GridRow[] = keyedRows.map((row) => ({
    Cols: delivered.map((col) => row[col.column_name]),
  }));

  const rowIds: string[] = keyedRows.map((row) => String(row[options.idField]));

  return { columns, rows, rowIds };
}
