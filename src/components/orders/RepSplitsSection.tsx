import React, { useState, useMemo } from 'react';
import { Panel, Button, SearchableSelect } from '../../ui';
import type { SearchableOption } from '../../ui';
import { mockReps } from '../../mock/orders/mockRepSplits';
import type { UseRepSplitsReturn } from '../../hooks/useRepSplits';

interface RepSplitsSectionProps {
  repSplits: UseRepSplitsReturn;
  /** When true, show a persistent "Get default rep splits" button (Order Edit mode). */
  showGetDefaults?: boolean;
  /** When true, all split fields are read-only (view-only mode for Order Edit). */
  readOnly?: boolean;
}

export const RepSplitsSection: React.FC<RepSplitsSectionProps> = ({ repSplits, showGetDefaults, readOnly }) => {
  const {
    splits,
    isLoaded,
    isModified,
    validation,
    addSplit,
    removeSplit,
    updateSplit,
    restoreDefaults,
  } = repSplits;

  const [addRepId, setAddRepId] = useState('');

  const usedRepIds = useMemo(
    () => new Set(splits.map((s) => s.rep_id)),
    [splits],
  );

  const availableReps = useMemo(
    () => mockReps.filter((r) => !usedRepIds.has(r.id)),
    [usedRepIds],
  );

  const addRepOptions: SearchableOption[] = useMemo(
    () => availableReps.map((r) => ({ id: r.id, label: r.name, secondary: r.code })),
    [availableReps],
  );

  const handleAdd = () => {
    if (!addRepId) return;
    addSplit(addRepId);
    setAddRepId('');
  };

  if (!isLoaded) {
    return (
      <div className="oe-section">
        <p className="oe-section__title">Rep Splits</p>
        <Panel>
          <div className="rs-empty">
            Select both a retailer and supplier to load default rep splits.
          </div>
        </Panel>
      </div>
    );
  }

  const salesErr = !validation.salesTotalValid && splits.length > 0;
  const commErr = !validation.commTotalValid && splits.length > 0;

  return (
    <div className="oe-section">
      <div className="rs-header">
        <p className="oe-section__title">Rep Splits</p>
        <div className="rs-header__actions">
          {showGetDefaults && (
            <Button variant="secondary" size="S" onClick={restoreDefaults}>
              Get default rep splits
            </Button>
          )}
          {!showGetDefaults && isModified && (
            <Button variant="text" size="S" onClick={restoreDefaults}>
              Restore Defaults
            </Button>
          )}
        </div>
      </div>

      <Panel style={{ padding: 0, overflow: 'hidden' }}>
        {splits.length === 0 ? (
          <div className="rs-empty">
            No rep splits assigned. Add a rep below.
          </div>
        ) : (
          <div className="rs-table-wrap">
            <table className="rs-table">
              <thead>
                <tr>
                  <th className="rs-table__th rs-table__th--rep">Rep</th>
                  <th className="rs-table__th rs-table__th--pct">Sales %</th>
                  <th className="rs-table__th rs-table__th--pct">Comm %</th>
                  {!readOnly && <th className="rs-table__th rs-table__th--action" />}
                </tr>
              </thead>
              <tbody>
                {splits.map((row, idx) => {
                  const rep = mockReps.find((r) => r.id === row.rep_id);
                  const isDup = validation.duplicateRepIds.has(row.rep_id);

                  return (
                    <tr key={idx} className={isDup ? 'rs-table__row--error' : ''}>
                      <td className="rs-table__td">
                        {readOnly ? (
                          <span className="rs-readonly-text">{rep?.name ?? row.rep_id}</span>
                        ) : (
                          <SearchableSelect
                            compact
                            value={row.rep_id}
                            onChange={(v) => updateSplit(idx, 'rep_id', v)}
                            options={[
                              ...(rep ? [{ id: rep.id, label: rep.name, secondary: rep.code }] : []),
                              ...mockReps
                                .filter((r) => r.id !== row.rep_id && !usedRepIds.has(r.id))
                                .map((r) => ({ id: r.id, label: r.name, secondary: r.code })),
                            ]}
                            placeholder="Select rep"
                          />
                        )}
                        {isDup && <span className="rs-inline-error">Duplicate rep</span>}
                      </td>
                      <td className="rs-table__td rs-table__td--pct">
                        {readOnly ? (
                          <span className="rs-readonly-text">{row.sales_pct}%</span>
                        ) : (
                          <input
                            className="rs-pct-input"
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            value={row.sales_pct}
                            onChange={(e) => updateSplit(idx, 'sales_pct', e.target.value)}
                          />
                        )}
                      </td>
                      <td className="rs-table__td rs-table__td--pct">
                        {readOnly ? (
                          <span className="rs-readonly-text">{row.comm_pct}%</span>
                        ) : (
                          <input
                            className="rs-pct-input"
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            value={row.comm_pct}
                            onChange={(e) => updateSplit(idx, 'comm_pct', e.target.value)}
                          />
                        )}
                      </td>
                      {!readOnly && (
                        <td className="rs-table__td rs-table__td--action">
                          <button
                            className="rs-remove-btn"
                            onClick={() => removeSplit(idx)}
                            aria-label={`Remove ${rep?.name ?? 'rep'}`}
                            title="Remove"
                          >
                            &times;
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="rs-table__totals">
                  <td className="rs-table__td rs-table__td--label">Totals</td>
                  <td className={`rs-table__td rs-table__td--pct${salesErr ? ' rs-table__td--invalid' : ''}`}>
                    <span className="rs-total-value">{validation.salesTotal}%</span>
                    {salesErr && <span className="rs-total-hint">must be 100%</span>}
                  </td>
                  <td className={`rs-table__td rs-table__td--pct${commErr ? ' rs-table__td--invalid' : ''}`}>
                    <span className="rs-total-value">{validation.commTotal}%</span>
                    {commErr && <span className="rs-total-hint">must be 100%</span>}
                  </td>
                  {!readOnly && <td className="rs-table__td" />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {!readOnly && (
          <div className="rs-add-bar">
            <SearchableSelect
              value={addRepId}
              onChange={setAddRepId}
              options={addRepOptions}
              placeholder={availableReps.length ? '— Add a rep —' : 'All reps assigned'}
              disabled={availableReps.length === 0}
            />
            <Button
              size="S"
              variant="secondary"
              disabled={!addRepId}
              onClick={handleAdd}
            >
              + Add
            </Button>
          </div>
        )}
      </Panel>

      {/* Validation summary */}
      {splits.length > 0 && !validation.isValid && (
        <div className="rs-validation">
          {salesErr && (
            <span className="rs-validation__msg rs-validation__msg--error">
              Sales split total is {validation.salesTotal}% (must be 100%)
            </span>
          )}
          {commErr && (
            <span className="rs-validation__msg rs-validation__msg--error">
              Comm split total is {validation.commTotal}% (must be 100%)
            </span>
          )}
          {validation.hasDuplicateReps && (
            <span className="rs-validation__msg rs-validation__msg--error">
              Duplicate reps are not allowed
            </span>
          )}
        </div>
      )}
      {splits.length > 0 && validation.isValid && (
        <div className="rs-validation">
          <span className="rs-validation__msg rs-validation__msg--ok">
            Splits are valid
          </span>
        </div>
      )}
    </div>
  );
};
