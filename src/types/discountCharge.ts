export type DCEntryType = 'discount' | 'charge' | 'credit';

export interface DiscountChargeEntry {
  id: string;
  type: DCEntryType;
  description: string;
  /** User-entered percentage (0–100). Null when amount was entered first. */
  percentage: number | null;
  /** Resolved dollar amount. Null when percentage was entered first without a base. */
  amount: number | null;
}

export type DCScope = 'header' | 'item';

export const DC_TYPE_OPTIONS: { value: DCEntryType; label: string }[] = [
  { value: 'discount', label: 'Discount' },
  { value: 'charge', label: 'Charge' },
  { value: 'credit', label: 'Credit' },
];
