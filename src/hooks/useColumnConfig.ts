import { useState, useCallback, useEffect } from 'react';
import type { ColumnConfig, DataType, NumberFormat, DisplayStyle } from '../types/columnConfig';
import { defaultColumnConfigs } from '../mock/orders/defaultColumnConfig';

const STORAGE_KEY = 'crisp_order_column_config';
const SCHEMA_VERSION = 2;
const VERSION_KEY = 'crisp_order_column_config_v';

function migrateV1toV2(raw: any[]): ColumnConfig[] {
  return raw.map((col) => {
    const migrated = { ...col };

    // v1 stored display format in data_type (e.g. 'dollars', 'percent')
    // v2 separates data_type (string/number/date) from number_format (dollars/number/percent)
    const oldDataType: string = col.data_type ?? 'string';

    if (oldDataType === 'dollars') {
      migrated.data_type = 'number' as DataType;
      migrated.number_format = 'dollars' as NumberFormat;
    } else if (oldDataType === 'percent') {
      migrated.data_type = 'number' as DataType;
      migrated.number_format = 'percent' as NumberFormat;
    } else if (oldDataType === 'number') {
      migrated.data_type = 'number' as DataType;
      migrated.number_format = (col.number_format === 'dollars' || col.number_format === 'percent')
        ? col.number_format
        : 'number' as NumberFormat;
    } else if (oldDataType === 'date') {
      migrated.data_type = 'date' as DataType;
      migrated.number_format = '' as NumberFormat;
    } else {
      migrated.data_type = 'string' as DataType;
      migrated.number_format = '' as NumberFormat;
    }

    if (!migrated.display_style) {
      migrated.display_style = 'default' as DisplayStyle;
    }

    return migrated as ColumnConfig;
  });
}

function loadFromStorage(): ColumnConfig[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    const storedVersion = Number(localStorage.getItem(VERSION_KEY) || '1');
    if (storedVersion < SCHEMA_VERSION) {
      const migrated = migrateV1toV2(parsed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
      return migrated;
    }

    return parsed as ColumnConfig[];
  } catch {
    return null;
  }
}

function saveToStorage(columns: ColumnConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
    localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
  } catch {
    // storage full or unavailable
  }
}

export function useColumnConfig() {
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    const stored = loadFromStorage();
    return stored ?? defaultColumnConfigs.map((c) => ({ ...c }));
  });

  useEffect(() => {
    saveToStorage(columns);
  }, [columns]);

  const visibleColumns = columns.filter((c) => c.visible);

  const toggleVisibility = useCallback((id: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    );
  }, []);

  const updateColumn = useCallback((id: string, updates: Partial<ColumnConfig>) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    setColumns((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = defaultColumnConfigs.map((c) => ({ ...c }));
    setColumns(defaults);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(VERSION_KEY);
    } catch { /* noop */ }
  }, []);

  const applyConfig = useCallback((newConfig: ColumnConfig[]) => {
    setColumns(newConfig.map((c) => ({ ...c })));
  }, []);

  return {
    columns,
    visibleColumns,
    toggleVisibility,
    updateColumn,
    moveColumn,
    resetToDefaults,
    applyConfig,
  };
}
