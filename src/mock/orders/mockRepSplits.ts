import type { MockRep, DefaultSplitRule } from '../../types/orderEntry';

export const mockReps: MockRep[] = [
  { id: 'rep-01', name: 'Sarah Chen', code: 'SC' },
  { id: 'rep-02', name: 'James Rivera', code: 'JR' },
  { id: 'rep-03', name: 'Dana Whitmore', code: 'DW' },
  { id: 'rep-04', name: 'Marcus Lee', code: 'ML' },
  { id: 'rep-05', name: 'Angela Brooks', code: 'AB' },
  { id: 'rep-06', name: 'Tom Nguyen', code: 'TN' },
  { id: 'rep-07', name: 'Rachel Owens', code: 'RO' },
  { id: 'rep-08', name: 'Kevin Patel', code: 'KP' },
];

/**
 * Lookup order:
 *   1. exact "retailerId::supplierId"
 *   2. wildcard "*::supplierId"
 *   3. global fallback "*::*"
 */
export const defaultSplitRules: DefaultSplitRule[] = [
  // Walmart + Acme Foods
  {
    key: 'ret-001::sup-001',
    splits: [
      { rep_id: 'rep-01', sales_pct: 60, comm_pct: 50 },
      { rep_id: 'rep-02', sales_pct: 40, comm_pct: 50 },
    ],
  },
  // Kroger + Acme Foods
  {
    key: 'ret-002::sup-001',
    splits: [
      { rep_id: 'rep-03', sales_pct: 50, comm_pct: 60 },
      { rep_id: 'rep-04', sales_pct: 50, comm_pct: 40 },
    ],
  },
  // Target + any supplier
  {
    key: 'ret-003::*',
    splits: [
      { rep_id: 'rep-05', sales_pct: 70, comm_pct: 70 },
      { rep_id: 'rep-06', sales_pct: 30, comm_pct: 30 },
    ],
  },
  // Any retailer + Pacific Produce
  {
    key: '*::sup-002',
    splits: [
      { rep_id: 'rep-07', sales_pct: 100, comm_pct: 100 },
    ],
  },
  // Global fallback
  {
    key: '*::*',
    splits: [
      { rep_id: 'rep-01', sales_pct: 50, comm_pct: 50 },
      { rep_id: 'rep-02', sales_pct: 50, comm_pct: 50 },
    ],
  },
];

export function lookupDefaultSplits(
  retailerId: string,
  supplierId: string,
): DefaultSplitRule | null {
  const exact = defaultSplitRules.find((r) => r.key === `${retailerId}::${supplierId}`);
  if (exact) return exact;

  const retailerWild = defaultSplitRules.find((r) => r.key === `${retailerId}::*`);
  if (retailerWild) return retailerWild;

  const supplierWild = defaultSplitRules.find((r) => r.key === `*::${supplierId}`);
  if (supplierWild) return supplierWild;

  return defaultSplitRules.find((r) => r.key === '*::*') ?? null;
}
