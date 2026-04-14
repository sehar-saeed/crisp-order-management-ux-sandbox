import { useState, useCallback, useMemo } from 'react';
import type { DiscountChargeEntry, DCEntryType } from '../types/discountCharge';

let nextId = 1;
function genId(): string {
  return `dc-${nextId++}-${Date.now().toString(36)}`;
}

export interface UseDiscountsChargesReturn {
  entries: DiscountChargeEntry[];
  addEntry: () => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, patch: Partial<Omit<DiscountChargeEntry, 'id'>>) => void;
  /** Recalculate amounts/percentages against a base amount. */
  recalculate: (baseAmount: number) => void;
  /** Net adjustment total (discounts/credits negative, charges positive). */
  netTotal: number;
  setEntries: (entries: DiscountChargeEntry[]) => void;
}

function signFor(type: DCEntryType): number {
  return type === 'charge' ? 1 : -1;
}

export function useDiscountsCharges(
  initial: DiscountChargeEntry[] = [],
): UseDiscountsChargesReturn {
  const [entries, setEntries] = useState<DiscountChargeEntry[]>(initial);

  const addEntry = useCallback(() => {
    setEntries((prev) => [
      ...prev,
      {
        id: genId(),
        type: 'discount',
        description: '',
        percentage: null,
        amount: null,
      },
    ]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateEntry = useCallback(
    (id: string, patch: Partial<Omit<DiscountChargeEntry, 'id'>>) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
    },
    [],
  );

  const recalculate = useCallback((baseAmount: number) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.percentage != null && e.amount == null) {
          return { ...e, amount: round2(baseAmount * e.percentage / 100) };
        }
        if (e.amount != null && e.percentage == null && baseAmount !== 0) {
          return { ...e, percentage: round4(Math.abs(e.amount) / baseAmount * 100) };
        }
        return e;
      }),
    );
  }, []);

  const netTotal = useMemo(
    () =>
      entries.reduce((sum, e) => {
        const amt = e.amount ?? 0;
        return sum + amt * signFor(e.type);
      }, 0),
    [entries],
  );

  return { entries, addEntry, removeEntry, updateEntry, recalculate, netTotal, setEntries };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
