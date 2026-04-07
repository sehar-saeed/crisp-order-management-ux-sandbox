import { useState, useMemo, useCallback } from 'react';
import type {
  MasterEntryField,
  ClientEntryOverride,
  ResolvedEntryField,
} from '../types/entryFieldConfig';
import {
  masterHeaderFields,
  masterTxnColumns,
} from '../mock/orders/masterEntryFields';

/**
 * localStorage keys — mock persistence standing in for backend/API
 * persistence of the custom_entry_fields table.
 */
const HEADER_KEY = 'crisp:order-entry:header-overrides';
const TXN_KEY = 'crisp:order-entry:txn-overrides';

function loadOverrides(key: string): ClientEntryOverride[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* corrupt or unavailable */ }
  return [];
}

function saveOverrides(key: string, overrides: ClientEntryOverride[]) {
  try {
    localStorage.setItem(key, JSON.stringify(overrides));
  } catch { /* storage full or unavailable */ }
}

/**
 * Merge master_entry_fields with client overrides.
 * Same resolution pattern as Order Browse:
 *   resolved value = override ?? master default
 *   has_override = true when at least one value differs from master
 */
export function resolveEntryFields(
  masters: readonly MasterEntryField[],
  overrides: ClientEntryOverride[],
): ResolvedEntryField[] {
  const ovMap = new Map(overrides.map((o) => [o.field_id, o]));

  return masters
    .map((m) => {
      const ov = ovMap.get(m.field_id);

      const caption = ov?.caption ?? m.caption;
      const visible = ov?.visible ?? m.default_visible;
      const sequence = ov?.sequence ?? m.default_sequence;

      const has_override =
        caption !== m.caption ||
        visible !== m.default_visible ||
        sequence !== m.default_sequence;

      return {
        field_id: m.field_id,
        scope: m.scope,
        caption,
        field_type: m.field_type,
        allow_hide: m.allow_hide,
        visible: m.allow_hide ? visible : true,
        sequence,
        has_override,
      };
    })
    .sort((a, b) => a.sequence - b.sequence);
}

export function compactEntryOverrides(
  overrides: ClientEntryOverride[],
  masters: readonly MasterEntryField[],
): ClientEntryOverride[] {
  const masterMap = new Map(masters.map((m) => [m.field_id, m]));

  return overrides
    .map((ov) => {
      const m = masterMap.get(ov.field_id);
      if (!m) return ov;
      const clean: ClientEntryOverride = { field_id: ov.field_id };
      if (ov.caption !== undefined && ov.caption !== m.caption) clean.caption = ov.caption;
      if (ov.visible !== undefined && ov.visible !== m.default_visible) clean.visible = ov.visible;
      if (ov.sequence !== undefined && ov.sequence !== m.default_sequence) clean.sequence = ov.sequence;
      return clean;
    })
    .filter((ov) => Object.keys(ov).length > 1);
}

function useFieldSet(
  masters: readonly MasterEntryField[],
  storageKey: string,
) {
  const [overrides, setOverrides] = useState<ClientEntryOverride[]>(
    () => loadOverrides(storageKey),
  );

  const resolved = useMemo(
    () => resolveEntryFields(masters, overrides),
    [masters, overrides],
  );

  const visible = useMemo(
    () => resolved.filter((f) => f.visible),
    [resolved],
  );

  const applyOverrides = useCallback(
    (next: ClientEntryOverride[]) => {
      const compact = compactEntryOverrides(next, masters);
      setOverrides(compact);
      saveOverrides(storageKey, compact);
    },
    [masters, storageKey],
  );

  const resetAll = useCallback(() => {
    setOverrides([]);
    saveOverrides(storageKey, []);
  }, [storageKey]);

  return {
    masters,
    overrides,
    resolved,
    visible,
    applyOverrides,
    resetAll,
  };
}

export type EntryFieldSet = ReturnType<typeof useFieldSet>;

export function useEntryFieldConfig() {
  const header = useFieldSet(masterHeaderFields, HEADER_KEY);
  const txn = useFieldSet(masterTxnColumns, TXN_KEY);

  return { header, txn };
}
