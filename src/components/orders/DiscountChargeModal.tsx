import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Button } from '../../ui';
import { useDiscountsCharges } from '../../hooks/useDiscountsCharges';
import { DC_TYPE_OPTIONS } from '../../types/discountCharge';
import type { DiscountChargeEntry, DCEntryType, DCScope } from '../../types/discountCharge';
import '../../styles/discount-charge.css';

interface DiscountChargeModalProps {
  scope: DCScope;
  /** Label shown in the modal title, e.g. "Order PO-2025-001" or "Line #3 — Olive Oil 500ml" */
  targetLabel: string;
  /** Base dollar amount used for percentage ↔ amount back-calculation. */
  baseAmount: number;
  /** Initial entries (the saved state). */
  initialEntries: DiscountChargeEntry[];
  /** Called with the final entries when user clicks Apply. */
  onApply: (entries: DiscountChargeEntry[]) => void;
  onClose: () => void;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export const DiscountChargeModal: React.FC<DiscountChargeModalProps> = ({
  scope,
  targetLabel,
  baseAmount,
  initialEntries,
  onApply,
  onClose,
}) => {
  const dc = useDiscountsCharges(initialEntries.map((e) => ({ ...e })));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handlePctChange = useCallback(
    (id: string, raw: string) => {
      setTouched(true);
      const pct = parseFloat(raw);
      if (isNaN(pct)) {
        dc.updateEntry(id, { percentage: null, amount: null });
        return;
      }
      const clamped = Math.max(0, Math.min(100, pct));
      dc.updateEntry(id, {
        percentage: round4(clamped),
        amount: round2(baseAmount * clamped / 100),
      });
    },
    [dc, baseAmount],
  );

  const handleAmtChange = useCallback(
    (id: string, raw: string) => {
      setTouched(true);
      const amt = parseFloat(raw);
      if (isNaN(amt)) {
        dc.updateEntry(id, { amount: null, percentage: null });
        return;
      }
      const absAmt = Math.abs(round2(amt));
      dc.updateEntry(id, {
        amount: absAmt,
        percentage: baseAmount !== 0 ? round4(absAmt / baseAmount * 100) : null,
      });
    },
    [dc, baseAmount],
  );

  const handleTypeChange = useCallback(
    (id: string, type: DCEntryType) => {
      setTouched(true);
      dc.updateEntry(id, { type });
    },
    [dc],
  );

  const handleDescChange = useCallback(
    (id: string, description: string) => {
      setTouched(true);
      dc.updateEntry(id, { description });
    },
    [dc],
  );

  const handleAdd = useCallback(() => {
    setTouched(true);
    dc.addEntry();
  }, [dc]);

  const handleRemove = useCallback(
    (id: string) => {
      setTouched(true);
      dc.removeEntry(id);
    },
    [dc],
  );

  const handleApply = useCallback(() => {
    onApply(dc.entries);
    onClose();
  }, [dc.entries, onApply, onClose]);

  const scopeLabel = scope === 'header' ? 'Order' : 'Item';
  const title = `${scopeLabel} Discounts & Charges — ${targetLabel}`;

  return (
    <Modal title={title} onCloseClick={onClose} wide>
      <div className="dcm">
        <div className="dcm__meta">
          <span className="dcm__base">Base amount: <strong>${baseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
          <span className={`dcm__net ${dc.netTotal >= 0 ? 'dcm__net--pos' : 'dcm__net--neg'}`}>
            Net adjustment: {dc.netTotal >= 0 ? '+' : ''}${dc.netTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {dc.entries.length === 0 ? (
          <div className="dcm__empty">
            No entries. Click "+ Add Row" to add a discount, charge, or credit.
          </div>
        ) : (
          <div className="dcm__table-wrap">
            <table className="dcm__table">
              <thead>
                <tr>
                  <th className="dcm__th dcm__th--type">Type</th>
                  <th className="dcm__th dcm__th--desc">Description</th>
                  <th className="dcm__th dcm__th--pct">%</th>
                  <th className="dcm__th dcm__th--amt">Amount</th>
                  <th className="dcm__th dcm__th--action" />
                </tr>
              </thead>
              <tbody>
                {dc.entries.map((entry) => (
                  <tr key={entry.id} className="dcm__row">
                    <td className="dcm__td">
                      <select
                        className="dcm__select"
                        value={entry.type}
                        onChange={(e) => handleTypeChange(entry.id, e.target.value as DCEntryType)}
                      >
                        {DC_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="dcm__td">
                      <input
                        className="dcm__input dcm__input--desc"
                        type="text"
                        placeholder="e.g. Early payment"
                        value={entry.description}
                        onChange={(e) => handleDescChange(entry.id, e.target.value)}
                      />
                    </td>
                    <td className="dcm__td dcm__td--right">
                      <input
                        className="dcm__input dcm__input--num"
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        placeholder="—"
                        value={entry.percentage ?? ''}
                        onChange={(e) => handlePctChange(entry.id, e.target.value)}
                      />
                    </td>
                    <td className="dcm__td dcm__td--right">
                      <input
                        className="dcm__input dcm__input--num"
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="—"
                        value={entry.amount ?? ''}
                        onChange={(e) => handleAmtChange(entry.id, e.target.value)}
                      />
                    </td>
                    <td className="dcm__td dcm__td--action">
                      <button
                        className="dcm__remove"
                        onClick={() => handleRemove(entry.id)}
                        title="Remove"
                        aria-label="Remove entry"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="dcm__actions">
          <Button variant="text" size="S" onClick={handleAdd}>+ Add Row</Button>
          <div className="dcm__actions-right">
            <Button variant="secondary" size="S" onClick={onClose}>Cancel</Button>
            <Button size="S" onClick={handleApply} disabled={!touched}>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
