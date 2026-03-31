import { useState, useMemo, useCallback } from 'react';
import type {
  MasterBrowseField,
  ClientBrowseOverride,
  ResolvedBrowseColumn,
} from '../types/browseConfig';
import { masterBrowseFields } from '../mock/orders/masterBrowseFields';
import { defaultClientOverrides } from '../mock/orders/clientBrowseOverrides';

/**
 * localStorage key used as **mock persistence** for custom_browse data.
 * In production this would be replaced by API calls to the backend that
 * reads/writes the custom_browse table.
 */
const STORAGE_KEY = 'crisp:order-browse:client-overrides';

function loadOverrides(): ClientBrowseOverride[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* corrupt or unavailable */ }
  return defaultClientOverrides.map((o) => ({ ...o }));
}

function saveOverrides(overrides: ClientBrowseOverride[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch { /* storage full or unavailable */ }
}

/**
 * Merge **master_custom_browse** field definitions with **custom_browse**
 * client overrides to produce the resolved column list the grid renders from.
 *
 * Resolution rules:
 *   1. Start from the full master field list (all available fields).
 *   2. For each field, look up a matching client override by field_id.
 *   3. Each resolved property = override value ?? master default.
 *   4. has_override = true only when at least one resolved value
 *      actually differs from its master default.
 *   5. Sort by resolved sequence.
 */
export function resolveColumns(
  fields: MasterBrowseField[],
  overrides: ClientBrowseOverride[],
): ResolvedBrowseColumn[] {
  const overrideMap = new Map(overrides.map((o) => [o.field_id, o]));

  return fields
    .map((master) => {
      const ov = overrideMap.get(master.field_id);

      const caption = ov?.caption ?? master.caption;
      const width_px = ov?.width_px ?? master.default_width_px;
      const visible = ov?.visible ?? master.default_visible;
      const sequence = ov?.sequence ?? master.default_sequence;
      const number_format = ov?.number_format ?? master.number_format;
      const decimal_places = ov?.decimal_places ?? master.decimal_places;

      const has_override =
        caption !== master.caption ||
        width_px !== master.default_width_px ||
        visible !== master.default_visible ||
        sequence !== master.default_sequence ||
        number_format !== master.number_format ||
        decimal_places !== master.decimal_places;

      return {
        field_id: master.field_id,
        caption,
        table_name: master.table_name,
        column_name: master.column_name,
        data_type: master.data_type,
        number_format,
        decimal_places,
        display_style: master.display_style,
        width_px,
        visible,
        sequence,
        has_override,
      };
    })
    .sort((a, b) => a.sequence - b.sequence);
}

/**
 * Strip no-op override properties (values that match the master default)
 * and drop entries that have no remaining meaningful overrides.
 * This keeps the custom_browse data minimal.
 */
export function compactOverrides(
  overrides: ClientBrowseOverride[],
  fields: readonly MasterBrowseField[],
): ClientBrowseOverride[] {
  const masterMap = new Map(fields.map((m) => [m.field_id, m]));

  return overrides
    .map((ov) => {
      const master = masterMap.get(ov.field_id);
      if (!master) return ov;

      const clean: ClientBrowseOverride = { field_id: ov.field_id };
      if (ov.caption !== undefined && ov.caption !== master.caption) clean.caption = ov.caption;
      if (ov.width_px !== undefined && ov.width_px !== master.default_width_px) clean.width_px = ov.width_px;
      if (ov.visible !== undefined && ov.visible !== master.default_visible) clean.visible = ov.visible;
      if (ov.sequence !== undefined && ov.sequence !== master.default_sequence) clean.sequence = ov.sequence;
      if (ov.number_format !== undefined && ov.number_format !== master.number_format) clean.number_format = ov.number_format;
      if (ov.decimal_places !== undefined && ov.decimal_places !== master.decimal_places) clean.decimal_places = ov.decimal_places;
      return clean;
    })
    .filter((ov) => Object.keys(ov).length > 1);
}

export function useBrowseConfig() {
  const [overrides, setOverrides] = useState<ClientBrowseOverride[]>(loadOverrides);

  const resolvedColumns = useMemo(
    () => resolveColumns(masterBrowseFields, overrides),
    [overrides],
  );

  const visibleColumns = useMemo(
    () => resolvedColumns.filter((c) => c.visible),
    [resolvedColumns],
  );

  const applyOverrides = useCallback((newOverrides: ClientBrowseOverride[]) => {
    const compact = compactOverrides(newOverrides, masterBrowseFields);
    setOverrides(compact);
    saveOverrides(compact);
  }, []);

  const resetAllOverrides = useCallback(() => {
    setOverrides([]);
    saveOverrides([]);
  }, []);

  return {
    masterFields: masterBrowseFields as readonly MasterBrowseField[],
    clientOverrides: overrides,
    resolvedColumns,
    visibleColumns,
    applyOverrides,
    resetAllOverrides,
  };
}
