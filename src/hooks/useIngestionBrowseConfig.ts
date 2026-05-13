import { useState, useMemo, useCallback } from 'react';
import type { MasterBrowseField, ClientBrowseOverride } from '../types/browseConfig';
import { masterIngestionBrowseFields } from '../mock/orders/masterIngestionBrowseFields';
import {
  resolveColumns,
  compactOverrides,
} from './useBrowseConfig';

const STORAGE_KEY = 'crisp:orders-workspace:ingestion-browse-overrides';

function loadOverrides(): ClientBrowseOverride[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function saveOverrides(overrides: ClientBrowseOverride[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch { /* ignore */ }
}

export function useIngestionBrowseConfig() {
  const [overrides, setOverrides] = useState<ClientBrowseOverride[]>(loadOverrides);

  const resolvedColumns = useMemo(
    () => resolveColumns(masterIngestionBrowseFields as MasterBrowseField[], overrides),
    [overrides],
  );

  const visibleColumns = useMemo(
    () => resolvedColumns.filter((c) => c.visible),
    [resolvedColumns],
  );

  const applyOverrides = useCallback((newOverrides: ClientBrowseOverride[]) => {
    const compact = compactOverrides(newOverrides, masterIngestionBrowseFields);
    setOverrides(compact);
    saveOverrides(compact);
  }, []);

  const resetAllOverrides = useCallback(() => {
    setOverrides([]);
    saveOverrides([]);
  }, []);

  return {
    masterFields: masterIngestionBrowseFields as readonly MasterBrowseField[],
    clientOverrides: overrides,
    resolvedColumns,
    visibleColumns,
    applyOverrides,
    resetAllOverrides,
  };
}
