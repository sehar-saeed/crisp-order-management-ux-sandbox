import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, Headline, Button, Flex, Spinner } from '../../ui';
import { fetchOrders } from '../../mock/api';
import { notificationService } from '../../services/NotificationService';
import { generateLineItems, generateOrderHistory } from '../../mock/orders/mockLineItems';
import { useEntryFieldConfig } from '../../hooks/useEntryFieldConfig';
import { useRepSplits } from '../../hooks/useRepSplits';
import { RepSplitsSection } from '../../components/orders/RepSplitsSection';
import { DiscountChargeModal } from '../../components/orders/DiscountChargeModal';
import { mockRetailers, mockSuppliers } from '../../mock/orders/mockParties';
import type { OrderBrowseRow } from '../../types/order';
import type { OrderLineItem, OrderHistoryEntry, HistorySource } from '../../mock/orders/mockLineItems';
import type { ResolvedEntryField } from '../../types/entryFieldConfig';
import type { DiscountChargeEntry } from '../../types/discountCharge';
import '../../styles/order-browse.css';
import '../../styles/discount-charge.css';

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Maps a resolved field_id to the display value from mock order data.
 * In a real system, the backend would deliver a key-value map of order detail values;
 * here we simulate that by mapping field_ids to OrderBrowseRow properties.
 */
function resolveFieldValue(field: ResolvedEntryField, order: OrderBrowseRow): string {
  switch (field.field_id) {
    case 'order_type':           return 'Purchase Order';
    case 'from_party':           return order.retailerName;
    case 'to_party':             return order.supplierName;
    case 'po_number':            return order.orderNumber;
    case 'po_date':              return order.orderDate;
    case 'test_order':           return 'No';
    case 'bill_to':              return `${order.retailerName} — billing address`;
    case 'ship_to':              return `${order.retailerName} — shipping address`;
    case 'ship_date':            return order.shipDate;
    case 'cancel_date':          return '—';
    case 'invoice_status':       return order.invoiceStatus;
    case 'shipment_status':      return order.shipmentStatus;
    case 'comm_status':          return order.commStatus;
    case 'total_amount':         return formatCurrency(order.totalAmount);
    case 'item_count':           return String(order.itemCount);
    case 'currency':             return 'USD';
    case 'payment_terms':        return 'Net 30';
    case 'department':           return 'Grocery';
    case 'division':             return '—';
    case 'buyer_ref':            return `${order.retailerName.split(' ')[0]}-REF-${order.orderNumber.slice(-3)}`;
    case 'vendor_ref':           return `${order.supplierName.split(' ')[0]}-ACK-${order.orderNumber.slice(-3)}`;
    case 'special_instructions': return '—';
    case 'fob':                  return '—';
    case 'carrier':              return 'FedEx Freight';
    case 'warehouse':            return '—';
    default:                     return '—';
  }
}

type TabId = 'lines' | 'history';

const INFO_FIELD_GROUPS: { key: string; title: string; fieldIds: string[] }[] = [
  { key: 'addresses', title: 'Addresses', fieldIds: ['bill_to', 'ship_to'] },
  { key: 'dates_status', title: 'Dates & Status', fieldIds: ['ship_date', 'cancel_date', 'invoice_status', 'shipment_status', 'comm_status'] },
  { key: 'financial', title: 'Financial', fieldIds: ['total_amount', 'item_count', 'currency', 'payment_terms'] },
  { key: 'references', title: 'References & Additional', fieldIds: ['department', 'division', 'buyer_ref', 'vendor_ref', 'special_instructions', 'fob', 'carrier', 'warehouse'] },
];

export const OrderEditPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { header } = useEntryFieldConfig();

  const [order, setOrder] = useState<OrderBrowseRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('lines');

  const retailerId = useMemo(
    () => mockRetailers.find((r) => r.name === order?.retailerName)?.id ?? '',
    [order?.retailerName],
  );
  const supplierId = useMemo(
    () => mockSuppliers.find((s) => s.name === order?.supplierName)?.id ?? '',
    [order?.supplierName],
  );
  const repSplits = useRepSplits(retailerId, supplierId);

  const EDIT_CORE_IDS = useMemo(() => new Set([
    'order_type', 'from_party', 'to_party', 'po_number',
    'total_amount', 'invoice_status', 'shipment_status',
  ]), []);

  const editPageHeaderValueFields = useMemo(
    () => header.visible.filter((f) => !EDIT_CORE_IDS.has(f.field_id)),
    [header.visible, EDIT_CORE_IDS],
  );

  const infoSections = useMemo(() => {
    const fieldMap = new Map(editPageHeaderValueFields.map((f) => [f.field_id, f]));
    const populated = INFO_FIELD_GROUPS
      .map((g) => ({
        ...g,
        fields: g.fieldIds.map((id) => fieldMap.get(id)).filter(Boolean) as typeof editPageHeaderValueFields,
      }))
      .filter((g) => g.fields.length > 0);

    const grouped = new Set(INFO_FIELD_GROUPS.flatMap((g) => g.fieldIds));
    const ungrouped = editPageHeaderValueFields.filter((f) => !grouped.has(f.field_id));
    if (ungrouped.length > 0) {
      populated.push({ key: 'other', title: 'Other', fieldIds: ungrouped.map((f) => f.field_id), fields: ungrouped });
    }
    return populated;
  }, [editPageHeaderValueFields]);

  const [headerDC, setHeaderDC] = useState<DiscountChargeEntry[]>([]);
  const [itemDCMap, setItemDCMap] = useState<Record<string, DiscountChargeEntry[]>>({});
  const [dcModal, setDcModal] = useState<{ scope: 'header'; } | { scope: 'item'; lineItem: OrderLineItem } | null>(null);

  const handleApplyHeaderDC = useCallback((entries: DiscountChargeEntry[]) => {
    setHeaderDC(entries);
    notificationService.success(`Discounts & charges updated (${entries.length} entries)`);
  }, []);

  const handleApplyItemDC = useCallback((lineItemId: string, entries: DiscountChargeEntry[]) => {
    setItemDCMap((prev) => ({ ...prev, [lineItemId]: entries }));
    notificationService.success(`Item discounts & charges updated (${entries.length} entries)`);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const orders = await fetchOrders();
        if (!cancelled) {
          setOrder(orders.find((o) => o.id === orderId) ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load order');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [orderId]);

  const lineItems = useMemo<OrderLineItem[]>(
    () => (order ? generateLineItems(order.id) : []),
    [order],
  );

  const history = useMemo<OrderHistoryEntry[]>(
    () => (order ? generateOrderHistory(order.id, order.orderDate) : []),
    [order],
  );

  const lineTotal = useMemo(
    () => lineItems.reduce((s, li) => s + li.extendedPrice, 0),
    [lineItems],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate('/orders');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <Panel style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#b91c1c', fontWeight: 500 }}>Unable to load order</p>
          <p style={{ color: 'var(--cool-gray-50)', fontSize: '13px', margin: '0.5rem 0 1rem' }}>{error}</p>
          <Flex style={{ gap: '0.5rem', justifyContent: 'center' }}>
            <Button variant="secondary" onClick={() => navigate('/orders')}>Back to Orders</Button>
          </Flex>
        </Panel>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '2rem' }}>
        <Panel style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--cool-gray-50)' }}>Order not found.</p>
          <Button variant="secondary" onClick={() => navigate('/orders')} style={{ marginTop: '1rem' }}>
            Back to Orders
          </Button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="od-page">
      {/* ── Top bar ── */}
      <div className="od-page__top-bar">
        <Flex style={{ gap: '1rem', alignItems: 'center' }}>
          <Button variant="text" onClick={() => navigate('/orders')}>&larr; Back</Button>
          <div>
            <span className="od-page__label">Order Edit</span>
            <Headline as="h1">{order.orderNumber}</Headline>
          </div>
          <span className={`ob-status ob-status--${order.invoiceStatus.toLowerCase()}`}>
            {order.invoiceStatus}
          </span>
        </Flex>
        <Flex style={{ gap: '0.5rem' }}>
          <Button
            size="S"
            onClick={() => notificationService.info('Full edit form coming soon — Order → Items → Transactions')}
          >
            Edit Order
          </Button>
          <Button size="S" variant="secondary" onClick={() => notificationService.success(`Order ${order.orderNumber} sent`)}>
            Send
          </Button>
          <Button
            size="S"
            variant="secondary"
            onClick={() => { notificationService.info(`Printing order ${order.orderNumber}...`); setTimeout(() => window.print(), 300); }}
          >
            Print
          </Button>
          <Button size="S" variant="secondary" onClick={() => notificationService.info('Export coming soon')}>
            Export
          </Button>
          <Button
            size="S"
            variant="secondary"
            style={{ color: '#ef4444', borderColor: '#ef4444' }}
            onClick={() => notificationService.warning('Delete not available in demo')}
          >
            Delete
          </Button>
        </Flex>
      </div>

      {/* ── Core fields (always visible) ── */}
      <Panel style={{ padding: '1.25rem' }}>
        <div className="od-grid">
          <CoreField label="Order Number" value={order.orderNumber} />
          <CoreField label="Retailer" value={order.retailerName} />
          <CoreField label="Supplier" value={order.supplierName} />
          <CoreField label="Total Amount" value={formatCurrency(order.totalAmount)} highlight />
          <CoreField label="Invoice Status" value={order.invoiceStatus} />
          <CoreField label="Shipment Status" value={order.shipmentStatus} />
          <div className="od-field">
            <DCActionButton
              entries={headerDC}
              onClick={() => setDcModal({ scope: 'header' })}
            />
          </div>
        </div>
      </Panel>

      {/* ── Inline Order Info sections ── */}
      {infoSections.length > 0 && (
        <div className="oe-info-sections">
          {infoSections.map((g) => (
            <section key={g.key} className="oe-info-section">
              <h3 className="oe-info-section__title">{g.title}</h3>
              <div className="oe-info-section__grid">
                {g.fields.map((f) => {
                  const wide = ['special_instructions', 'bill_to', 'ship_to'].includes(f.field_id);
                  return (
                    <div key={f.field_id} className={`oe-info-field oe-info-field--readonly${wide ? ' oe-info-field--wide' : ''}`}>
                      <span className="oe-info-field__label">
                        {f.caption}
                        {f.has_override && (
                          <span className="oe-info-field__dot" title="Customized" />
                        )}
                      </span>
                      <span className="oe-info-field__value">{resolveFieldValue(f, order)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="od-tabs" style={{ marginTop: '1.25rem' }}>
        <button
          className={`od-tabs__tab${activeTab === 'lines' ? ' od-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('lines')}
        >
          Line Items ({lineItems.length})
        </button>
        <button
          className={`od-tabs__tab${activeTab === 'history' ? ' od-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History / Modifications ({history.length})
        </button>
      </div>

      {/* ── Tab: Line Items + Rep Splits ── */}
      {activeTab === 'lines' && (
        <div className="od-tab-panel od-tab-panel--flush">
          <div className="od-line-table-wrap">
            <table className="od-line-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>UPC</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>UOM</th>
                  <th>Unit Price</th>
                  <th>Extended</th>
                  <th className="od-line-table__center">D&amp;C</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li) => {
                  const itemEntries = itemDCMap[li.id] ?? [];
                  return (
                    <tr key={li.id}>
                      <td className="od-line-table__num">{li.lineNumber}</td>
                      <td className="od-line-table__mono">{li.upc}</td>
                      <td>{li.description}</td>
                      <td className="od-line-table__right">{li.quantity.toLocaleString()}</td>
                      <td>{li.unitOfMeasure}</td>
                      <td className="od-line-table__right">{formatCurrency(li.unitPrice)}</td>
                      <td className="od-line-table__right">{formatCurrency(li.extendedPrice)}</td>
                      <td className="od-line-table__center">
                        <DCCompactButton
                          entries={itemEntries}
                          onClick={() => setDcModal({ scope: 'item', lineItem: li })}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7} className="od-line-table__total-label">Total</td>
                  <td className="od-line-table__right od-line-table__total-value">
                    {formatCurrency(lineTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style={{ padding: '0 1rem 1rem' }}>
            <RepSplitsSection repSplits={repSplits} showGetDefaults readOnly />
          </div>
        </div>
      )}

      {/* ── Tab: History / Modifications ── */}
      {activeTab === 'history' && (
        <div className="od-tab-panel">
          <HistoryModificationsTab entries={history} />
        </div>
      )}

      {/* ── Discount / Charge Modals ── */}
      {dcModal?.scope === 'header' && (
        <DiscountChargeModal
          scope="header"
          targetLabel={`Order ${order.orderNumber}`}
          baseAmount={order.totalAmount}
          initialEntries={headerDC}
          onApply={handleApplyHeaderDC}
          onClose={() => setDcModal(null)}
        />
      )}
      {dcModal?.scope === 'item' && (
        <DiscountChargeModal
          scope="item"
          targetLabel={`Line #${dcModal.lineItem.lineNumber} — ${dcModal.lineItem.description}`}
          baseAmount={dcModal.lineItem.extendedPrice}
          initialEntries={itemDCMap[dcModal.lineItem.id] ?? []}
          onApply={(entries) => handleApplyItemDC(dcModal.lineItem.id, entries)}
          onClose={() => setDcModal(null)}
        />
      )}
    </div>
  );
};

/* ── Core field (top summary section) ── */

function CoreField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="od-field">
      <span className="od-field__label">{label}</span>
      <span className={`od-field__value${highlight ? ' od-field__value--highlight' : ''}`}>{value}</span>
    </div>
  );
}

/* ── Discounts & Charges triggers ── */

function dcNetTotal(entries: DiscountChargeEntry[]): number {
  return entries.reduce((sum, e) => {
    const amt = e.amount ?? 0;
    return sum + amt * (e.type === 'charge' ? 1 : -1);
  }, 0);
}

function formatNet(n: number): string {
  const abs = Math.abs(n);
  const str = '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n >= 0 ? `+${str}` : `-${str}`;
}

function DCActionButton({ entries, onClick }: { entries: DiscountChargeEntry[]; onClick: () => void }) {
  const hasEntries = entries.length > 0;
  const net = hasEntries ? dcNetTotal(entries) : 0;
  return (
    <button
      className={`dc-action-btn${hasEntries ? ' dc-action-btn--active' : ''}`}
      onClick={onClick}
      title={hasEntries ? `${entries.length} entries — net ${formatNet(net)}` : 'Add discounts & charges'}
    >
      <span className="dc-action-btn__label">Discounts &amp; Charges</span>
      <span className={`dc-action-btn__value${hasEntries ? '' : ' dc-action-btn__value--none'}`}>
        {hasEntries ? formatNet(net) : 'None'}
      </span>
    </button>
  );
}

function DCCompactButton({ entries, onClick }: { entries: DiscountChargeEntry[]; onClick: () => void }) {
  const hasEntries = entries.length > 0;
  const net = hasEntries ? dcNetTotal(entries) : 0;
  return (
    <button
      className={`dc-action-btn dc-action-btn--compact${hasEntries ? ' dc-action-btn--active' : ''}`}
      onClick={onClick}
      title={hasEntries ? `${entries.length} entries — net ${formatNet(net)}` : 'Add discounts & charges'}
    >
      {hasEntries
        ? <span className="dc-action-btn__value">{formatNet(net)}</span>
        : <span className="dc-action-btn__value dc-action-btn__value--none">None</span>
      }
    </button>
  );
}

/* ── History / Modifications Tab ── */

const SOURCE_META: Record<HistorySource, { label: string; cssClass: string }> = {
  manual: { label: 'Manual', cssClass: 'od-src--manual' },
  edi:    { label: 'EDI', cssClass: 'od-src--edi' },
  upload: { label: 'Upload', cssClass: 'od-src--upload' },
  system: { label: 'System', cssClass: 'od-src--system' },
};

function HistoryModificationsTab({ entries }: { entries: OrderHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="od-hv__empty">
        No history or modification records for this order.
      </div>
    );
  }

  return (
    <div className="od-timeline">
      {entries.map((entry, idx) => {
        const src = SOURCE_META[entry.source] ?? SOURCE_META.system;
        const isLast = idx === entries.length - 1;

        return (
          <div key={entry.id} className="od-timeline__entry">
            <div className="od-timeline__dot-col">
              <div className={`od-timeline__dot od-timeline__dot--${entry.source}${isLast ? ' od-timeline__dot--last' : ''}`} />
              {!isLast && <div className="od-timeline__line" />}
            </div>
            <div className="od-timeline__content">
              <div className="od-timeline__header-row">
                <span className="od-timeline__action">{entry.action}</span>
                <span className={`od-src-badge ${src.cssClass}`}>{src.label}</span>
              </div>
              <div className="od-timeline__detail">{entry.detail}</div>
              {entry.field && (
                <div className="od-timeline__field-change">
                  <span className="od-timeline__field-name">{entry.field}:</span>
                  {entry.oldValue && (
                    <span className="od-timeline__old-val">{entry.oldValue}</span>
                  )}
                  {entry.oldValue && entry.newValue && (
                    <span className="od-timeline__arrow">&rarr;</span>
                  )}
                  {entry.newValue && (
                    <span className="od-timeline__new-val">{entry.newValue}</span>
                  )}
                </div>
              )}
              <div className="od-timeline__meta">
                {formatDateTime(entry.timestamp)} &middot; {entry.user}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

