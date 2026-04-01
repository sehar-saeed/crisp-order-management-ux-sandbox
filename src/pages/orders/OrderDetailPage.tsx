import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, Headline, Button, Flex, Spinner } from '../../ui';
import { fetchOrders } from '../../mock/api';
import { notificationService } from '../../services/NotificationService';
import { generateLineItems, generateOrderHistory } from '../../mock/orders/mockLineItems';
import type { OrderBrowseRow } from '../../types/order';
import type { OrderLineItem, OrderHistoryEntry } from '../../mock/orders/mockLineItems';
import '../../styles/order-browse.css';

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderBrowseRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'lines' | 'history'>('lines');

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
    [order]
  );

  const history = useMemo<OrderHistoryEntry[]>(
    () => (order ? generateOrderHistory(order.id, order.orderDate) : []),
    [order]
  );

  const lineTotal = useMemo(
    () => lineItems.reduce((s, li) => s + li.extendedPrice, 0),
    [lineItems]
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
      <div className="od-page__top-bar">
        <Flex style={{ gap: '1rem', alignItems: 'center' }}>
          <Button variant="text" onClick={() => navigate('/orders')}>&larr; Back</Button>
          <Headline as="h1">Order {order.orderNumber}</Headline>
          <span className={`ob-status ob-status--${order.invoiceStatus.toLowerCase()}`}>
            {order.invoiceStatus}
          </span>
        </Flex>
        <Flex style={{ gap: '0.5rem' }}>
          <Button
            size="S"
            variant="secondary"
            onClick={() => notificationService.success(`Order ${order.orderNumber} sent`)}
          >
            Send
          </Button>
          <Button
            size="S"
            variant="secondary"
            onClick={() => {
              notificationService.info(`Printing order ${order.orderNumber}...`);
              setTimeout(() => window.print(), 300);
            }}
          >
            Print
          </Button>
          <Button
            size="S"
            variant="secondary"
            onClick={() => notificationService.info('Export coming soon')}
          >
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

      <Panel style={{ padding: '1.25rem' }}>
        <div className="od-grid">
          <DetailField label="Order Number" value={order.orderNumber} />
          <DetailField label="Retailer" value={order.retailerName} />
          <DetailField label="Supplier" value={order.supplierName} />
          <DetailField label="Order Date" value={order.orderDate} />
          <DetailField label="Ship Date" value={order.shipDate} />
          <DetailField label="Total Amount" value={formatCurrency(order.totalAmount)} />
          <DetailField label="Item Count" value={String(order.itemCount)} />
          <DetailField label="Invoice Status" value={order.invoiceStatus} />
          <DetailField label="Shipment Status" value={order.shipmentStatus} />
          <DetailField label="Comm Status" value={order.commStatus} />
        </div>
      </Panel>

      <div className="od-tabs">
        <button
          className={`od-tabs__tab ${activeTab === 'lines' ? 'od-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('lines')}
        >
          Line Items ({lineItems.length})
        </button>
        <button
          className={`od-tabs__tab ${activeTab === 'history' ? 'od-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History ({history.length})
        </button>
      </div>

      {activeTab === 'lines' && (
        <Panel style={{ padding: 0, overflow: 'hidden' }}>
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
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li) => (
                  <tr key={li.id}>
                    <td className="od-line-table__num">{li.lineNumber}</td>
                    <td className="od-line-table__mono">{li.upc}</td>
                    <td>{li.description}</td>
                    <td className="od-line-table__right">{li.quantity.toLocaleString()}</td>
                    <td>{li.unitOfMeasure}</td>
                    <td className="od-line-table__right">{formatCurrency(li.unitPrice)}</td>
                    <td className="od-line-table__right">{formatCurrency(li.extendedPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="od-line-table__total-label">Total</td>
                  <td className="od-line-table__right od-line-table__total-value">
                    {formatCurrency(lineTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>
      )}

      {activeTab === 'history' && (
        <Panel style={{ padding: '1.25rem' }}>
          <div className="od-timeline">
            {history.map((entry, idx) => (
              <div key={entry.id} className="od-timeline__entry">
                <div className="od-timeline__dot-col">
                  <div className={`od-timeline__dot ${idx === history.length - 1 ? 'od-timeline__dot--last' : ''}`} />
                  {idx < history.length - 1 && <div className="od-timeline__line" />}
                </div>
                <div className="od-timeline__content">
                  <div className="od-timeline__action">{entry.action}</div>
                  <div className="od-timeline__detail">{entry.detail}</div>
                  <div className="od-timeline__meta">
                    {formatDateTime(entry.timestamp)} &middot; {entry.user}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
};

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="od-field">
      <span className="od-field__label">{label}</span>
      <span className="od-field__value">{value}</span>
    </div>
  );
}
