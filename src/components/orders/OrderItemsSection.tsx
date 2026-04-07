import React, { useState, useMemo } from 'react';
import { Panel, Button, SearchableSelect } from '../../ui';
import type { SearchableOption } from '../../ui';
import { mockProducts } from '../../mock/orders/mockProducts';
import { UOMS } from '../../types/orderEntry';
import type { ItemTransaction } from '../../types/orderEntry';
import type { UseOrderItemsReturn } from '../../hooks/useOrderItems';
import type { EntryFieldSet } from '../../hooks/useEntryFieldConfig';
import type { ResolvedEntryField } from '../../types/entryFieldConfig';

interface OrderItemsSectionProps {
  orderItems: UseOrderItemsReturn;
  txnConfig: EntryFieldSet;
}

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Maps a resolved txn column field_id to the cell renderer
 * for a given transaction row.
 */
function TxnCell({
  col,
  txn,
  itemId,
  updateTransaction,
}: {
  col: ResolvedEntryField;
  txn: ItemTransaction;
  itemId: string;
  updateTransaction: UseOrderItemsReturn['updateTransaction'];
}) {
  switch (col.field_id) {
    case 'txn_qty':
      return (
        <input
          className="oi-txn-input oi-txn-input--num"
          type="number"
          min={0}
          value={txn.qty}
          onChange={(e) => updateTransaction(itemId, txn.id, 'qty', e.target.value)}
        />
      );
    case 'txn_uom':
      return (
        <select
          className="oi-txn-select"
          value={txn.uom}
          onChange={(e) => updateTransaction(itemId, txn.id, 'uom', e.target.value)}
        >
          {UOMS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      );
    case 'txn_unit_price':
      return (
        <input
          className="oi-txn-input oi-txn-input--num"
          type="number"
          min={0}
          step={0.01}
          value={txn.unit_price}
          onChange={(e) => updateTransaction(itemId, txn.id, 'unit_price', e.target.value)}
        />
      );
    case 'txn_store':
      return (
        <input
          className="oi-txn-input"
          type="text"
          placeholder="optional"
          value={txn.store_number}
          onChange={(e) => updateTransaction(itemId, txn.id, 'store_number', e.target.value)}
        />
      );
    case 'txn_ship_date':
      return (
        <input
          className="oi-txn-input"
          type="date"
          value={txn.ship_date}
          onChange={(e) => updateTransaction(itemId, txn.id, 'ship_date', e.target.value)}
        />
      );
    case 'txn_cancel_date':
      return (
        <input
          className="oi-txn-input"
          type="date"
          value={txn.cancel_date}
          onChange={(e) => updateTransaction(itemId, txn.id, 'cancel_date', e.target.value)}
        />
      );
    case 'txn_extended': {
      const ext = Math.round(txn.qty * txn.unit_price * 100) / 100;
      return <>{formatCurrency(ext)}</>;
    }
    default:
      return null;
  }
}

export const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  orderItems,
  txnConfig,
}) => {
  const {
    hasItems,
    setHasItems,
    items,
    addItem,
    removeItem,
    updateItemField,
    addTransaction,
    removeTransaction,
    updateTransaction,
    itemTotals,
    orderTotal,
    orderQty,
  } = orderItems;

  const visibleCols = txnConfig.visible;

  const [addProductId, setAddProductId] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const usedProductIds = useMemo(
    () => new Set(items.map((it) => it.product_id)),
    [items],
  );

  const productOptions: SearchableOption[] = useMemo(
    () =>
      mockProducts
        .filter((p) => !usedProductIds.has(p.id))
        .map((p) => ({
          id: p.id,
          label: p.description,
          secondary: `UPC: ${p.upc}`,
          group: p.category,
        })),
    [usedProductIds],
  );

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddAndExpand = () => {
    if (!addProductId) return;
    addItem(addProductId);
    setAddProductId('');
  };

  React.useEffect(() => {
    if (items.length > 0) {
      const last = items[items.length - 1];
      setExpandedItems((prev) => {
        if (prev.has(last.id)) return prev;
        const next = new Set(prev);
        next.add(last.id);
        return next;
      });
    }
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasExtended = visibleCols.some((c) => c.field_id === 'txn_extended');
  const extendedColIndex = visibleCols.findIndex((c) => c.field_id === 'txn_extended');
  const dataColCount = visibleCols.filter((c) => c.field_id !== 'txn_extended').length;

  return (
    <div className="oe-section">
      <div className="oi-header">
        <p className="oe-section__title">Order Items</p>
        <div className="oe-toggle">
          <label className="oe-toggle__switch">
            <input
              type="checkbox"
              checked={hasItems}
              onChange={(e) => setHasItems(e.target.checked)}
            />
            <span className="oe-toggle__track" />
          </label>
          <span className="oe-toggle__label">
            {hasItems ? 'With Items' : 'No Items (header only)'}
          </span>
        </div>
      </div>

      {!hasItems && (
        <Panel>
          <div className="oi-empty">
            This order has no line items. Only header-level data will be saved.
          </div>
        </Panel>
      )}

      {hasItems && (
        <>
          {items.length === 0 && (
            <Panel>
              <div className="oi-empty">
                No items added yet. Use the product selector below to add items.
              </div>
            </Panel>
          )}

          {items.map((item) => {
            const product = mockProducts.find((p) => p.id === item.product_id);
            const totals = itemTotals.find((t) => t.itemId === item.id);
            const isExpanded = expandedItems.has(item.id);

            return (
              <div key={item.id} className="oi-card">
                <div className="oi-card__header" onClick={() => toggleExpand(item.id)}>
                  <div className="oi-card__line">#{item.line_number}</div>
                  <div className="oi-card__info">
                    <span className="oi-card__desc">{item.description}</span>
                    <span className="oi-card__upc">UPC: {item.upc}</span>
                    {product && (
                      <span className="oi-card__cat">{product.category}</span>
                    )}
                  </div>
                  <div className="oi-card__summary">
                    <span className="oi-card__summary-qty">
                      {totals?.qty ?? 0} units
                    </span>
                    <span className="oi-card__summary-amt">
                      {formatCurrency(totals?.extended ?? 0)}
                    </span>
                  </div>
                  <button
                    className="oi-card__chevron"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? '\u25B2' : '\u25BC'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="oi-card__body">
                    <div className="oi-card__fields">
                      <div className="oi-field">
                        <label className="oi-field__label">Description</label>
                        <input
                          className="oi-field__input"
                          value={item.description}
                          onChange={(e) =>
                            updateItemField(item.id, 'description', e.target.value)
                          }
                        />
                      </div>
                      <div className="oi-field">
                        <label className="oi-field__label">UPC</label>
                        <input
                          className="oi-field__input oi-field__input--mono"
                          value={item.upc}
                          onChange={(e) =>
                            updateItemField(item.id, 'upc', e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* Config-driven transaction table */}
                    <div className="oi-txn-wrap">
                      <table className="oi-txn-table">
                        <thead>
                          <tr>
                            {visibleCols.map((col) => (
                              <th
                                key={col.field_id}
                                className={`oi-txn-th${col.field_id === 'txn_extended' ? ' oi-txn-th--ext' : ''}`}
                              >
                                {col.caption}
                              </th>
                            ))}
                            <th className="oi-txn-th oi-txn-th--action" />
                          </tr>
                        </thead>
                        <tbody>
                          {item.transactions.map((txn) => (
                            <tr key={txn.id}>
                              {visibleCols.map((col) => (
                                <td
                                  key={col.field_id}
                                  className={`oi-txn-td${col.field_id === 'txn_extended' ? ' oi-txn-td--ext' : ''}`}
                                >
                                  <TxnCell
                                    col={col}
                                    txn={txn}
                                    itemId={item.id}
                                    updateTransaction={updateTransaction}
                                  />
                                </td>
                              ))}
                              <td className="oi-txn-td oi-txn-td--action">
                                {item.transactions.length > 1 && (
                                  <button
                                    className="rs-remove-btn"
                                    onClick={() => removeTransaction(item.id, txn.id)}
                                    aria-label="Remove transaction"
                                    title="Remove"
                                  >
                                    &times;
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {item.transactions.length > 1 && hasExtended && (
                          <tfoot>
                            <tr className="oi-txn-totals">
                              <td
                                className="oi-txn-td oi-txn-td--total-label"
                                colSpan={extendedColIndex > 0 ? extendedColIndex : dataColCount}
                              >
                                Item Total
                              </td>
                              <td className="oi-txn-td oi-txn-td--ext oi-txn-td--total-value">
                                {formatCurrency(totals?.extended ?? 0)}
                              </td>
                              {/* fill remaining columns + action */}
                              {extendedColIndex < visibleCols.length - 1 && (
                                <td
                                  className="oi-txn-td"
                                  colSpan={visibleCols.length - extendedColIndex}
                                />
                              )}
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>

                    <div className="oi-card__actions">
                      <Button
                        size="S"
                        variant="text"
                        onClick={() => addTransaction(item.id)}
                      >
                        + Add Transaction
                      </Button>
                      <Button
                        size="S"
                        variant="text"
                        style={{ color: '#b91c1c' }}
                        onClick={() => removeItem(item.id)}
                      >
                        Remove Item
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <Panel style={{ padding: '0.75rem' }}>
            <div className="oi-add-bar">
              <SearchableSelect
                value={addProductId}
                onChange={setAddProductId}
                options={productOptions}
                placeholder="— Search products to add —"
                emptyMessage="No matching products"
              />
              <Button
                size="S"
                variant="secondary"
                disabled={!addProductId}
                onClick={handleAddAndExpand}
              >
                + Add Item
              </Button>
            </div>
          </Panel>

          {items.length > 0 && (
            <div className="oi-order-totals">
              <div className="oi-order-totals__row">
                <span className="oi-order-totals__label">
                  {items.length} item{items.length !== 1 ? 's' : ''} &middot; {orderQty} units
                </span>
                <span className="oi-order-totals__value">
                  Order Total: {formatCurrency(orderTotal)}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
