import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { RepSplitRow } from '../types/orderEntry';
import { lookupDefaultSplits } from '../mock/orders/mockRepSplits';

export interface RepSplitValidation {
  salesTotalValid: boolean;
  commTotalValid: boolean;
  hasDuplicateReps: boolean;
  salesTotal: number;
  commTotal: number;
  duplicateRepIds: Set<string>;
  isValid: boolean;
}

export interface UseRepSplitsReturn {
  splits: RepSplitRow[];
  defaultSplits: RepSplitRow[];
  isLoaded: boolean;
  isModified: boolean;
  validation: RepSplitValidation;
  addSplit: (repId: string) => void;
  removeSplit: (index: number) => void;
  updateSplit: (index: number, field: 'rep_id' | 'sales_pct' | 'comm_pct', value: string | number) => void;
  restoreDefaults: () => void;
  setSplits: (rows: RepSplitRow[]) => void;
}

function validate(rows: RepSplitRow[]): RepSplitValidation {
  const salesTotal = rows.reduce((s, r) => s + r.sales_pct, 0);
  const commTotal = rows.reduce((s, r) => s + r.comm_pct, 0);
  const salesTotalValid = Math.abs(salesTotal - 100) < 0.001;
  const commTotalValid = Math.abs(commTotal - 100) < 0.001;

  const seen = new Set<string>();
  const duplicateRepIds = new Set<string>();
  for (const r of rows) {
    if (r.rep_id && seen.has(r.rep_id)) {
      duplicateRepIds.add(r.rep_id);
    }
    if (r.rep_id) seen.add(r.rep_id);
  }

  return {
    salesTotal: Math.round(salesTotal * 100) / 100,
    commTotal: Math.round(commTotal * 100) / 100,
    salesTotalValid,
    commTotalValid,
    hasDuplicateReps: duplicateRepIds.size > 0,
    duplicateRepIds,
    isValid: salesTotalValid && commTotalValid && duplicateRepIds.size === 0 && rows.length > 0,
  };
}

function splitsEqual(a: RepSplitRow[], b: RepSplitRow[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((r, i) =>
    r.rep_id === b[i].rep_id &&
    r.sales_pct === b[i].sales_pct &&
    r.comm_pct === b[i].comm_pct,
  );
}

export function useRepSplits(retailerId: string, supplierId: string): UseRepSplitsReturn {
  const [splits, setSplits] = useState<RepSplitRow[]>([]);
  const [defaultSplits, setDefaultSplits] = useState<RepSplitRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const prevKeyRef = useRef('');

  useEffect(() => {
    const key = `${retailerId}::${supplierId}`;
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;

    if (!retailerId || !supplierId) {
      setSplits([]);
      setDefaultSplits([]);
      setIsLoaded(false);
      return;
    }

    const rule = lookupDefaultSplits(retailerId, supplierId);
    const rows = rule ? rule.splits.map((s) => ({ ...s })) : [];
    setDefaultSplits(rows.map((s) => ({ ...s })));
    setSplits(rows);
    setIsLoaded(true);
  }, [retailerId, supplierId]);

  const validation = useMemo(() => validate(splits), [splits]);
  const isModified = useMemo(() => !splitsEqual(splits, defaultSplits), [splits, defaultSplits]);

  const addSplit = useCallback((repId: string) => {
    setSplits((prev) => [...prev, { rep_id: repId, sales_pct: 0, comm_pct: 0 }]);
  }, []);

  const removeSplit = useCallback((index: number) => {
    setSplits((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateSplit = useCallback(
    (index: number, field: 'rep_id' | 'sales_pct' | 'comm_pct', value: string | number) => {
      setSplits((prev) =>
        prev.map((row, i) => {
          if (i !== index) return row;
          if (field === 'rep_id') return { ...row, rep_id: value as string };
          const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
          const clamped = Math.max(0, Math.min(100, num));
          return { ...row, [field]: Math.round(clamped * 100) / 100 };
        }),
      );
    },
    [],
  );

  const restoreDefaults = useCallback(() => {
    setSplits(defaultSplits.map((s) => ({ ...s })));
  }, [defaultSplits]);

  return {
    splits,
    defaultSplits,
    isLoaded,
    isModified,
    validation,
    addSplit,
    removeSplit,
    updateSplit,
    restoreDefaults,
    setSplits,
  };
}
