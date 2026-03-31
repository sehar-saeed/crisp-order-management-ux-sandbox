import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Panel, Headline, Button, Flex, Spinner, TextField, SelectField, Modal, DataGrid } from '../ui';
import { useSession } from '../mock/SessionProvider';
import { fetchOrders } from '../mock/api';
import { notificationService } from '../services/NotificationService';
import { ErrorState } from '../components/common/CommonComponents';
import type { OrderBrowseRow, QuickFindMode } from '../types/order';

const CheckboxRenderer: React.FC<{
  data: OrderBrowseRow;
  isSelected: boolean;
  onToggle: (id: string) => void;
}> = ({ data, isSelected, onToggle }) => (
  <div className="row-action-button-wrapper">
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => onToggle(data.id)}
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

export const OrderBrowse: React.FC = () => {
  const { isAdmin } = useSession();
  const gridRef = useRef<any>(null);

  const [orders, setOrders] = useState<OrderBrowseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quickFindMode, setQuickFindMode] = useState<QuickFindMode>('startsWith');
  const [quickFindValue, setQuickFindValue] = useState('');

  const [showChooserModal, setShowChooserModal] = useState(false);
  const [chooserResults, setChooserResults] = useState<OrderBrowseRow[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOrders();
      setOrders(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = () => setSelectedIds(new Set(orders.map((o) => o.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleQuickFind = () => {
    const term = quickFindValue.trim().toLowerCase();
    if (!term) {
      notificationService.warning('Please enter a PO number to search');
      return;
    }

    const matches = orders.filter((o) => {
      const on = o.orderNumber.toLowerCase();
      switch (quickFindMode) {
        case 'startsWith': return on.startsWith(term);
        case 'endsWith': return on.endsWith(term);
        case 'contains': return on.includes(term);
      }
    });

    if (matches.length === 0) {
      notificationService.warning(`No orders found matching "${quickFindValue}"`);
    } else if (matches.length === 1) {
      setSelectedIds(new Set([matches[0].id]));
      notificationService.success(`Found order ${matches[0].orderNumber}`);
    } else {
      setChooserResults(matches);
      setShowChooserModal(true);
    }
  };

  const handleBatchDelete = async () => {
    setIsDeleting(true);
    await new Promise((r) => setTimeout(r, 600));
    setOrders((prev) => prev.filter((o) => !selectedIds.has(o.id)));
    const count = selectedIds.size;
    setSelectedIds(new Set());
    setShowDeleteModal(false);
    setIsDeleting(false);
    notificationService.success(`${count} order(s) deleted successfully`);
  };

  const formatCurrency = (amount: number) =>
    '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const columnDefs = useMemo(() => [
    {
      headerName: '',
      field: 'id',
      width: 50,
      cellRenderer: (params: any) => (
        <CheckboxRenderer data={params.data} isSelected={selectedIds.has(params.data.id)} onToggle={toggleSelection} />
      ),
      sortable: false,
      filter: false,
    },
    { headerName: 'Order Number', field: 'orderNumber', flex: 1.2 },
    { headerName: 'Retailer', field: 'retailerName', flex: 1.2 },
    { headerName: 'Supplier', field: 'supplierName', flex: 1.5 },
    { headerName: 'Order Date', field: 'orderDate', flex: 1 },
    { headerName: 'Ship Date', field: 'shipDate', flex: 1 },
    { headerName: 'Invoice Status', field: 'invoiceStatus', flex: 1 },
    { headerName: 'Shipment Status', field: 'shipmentStatus', flex: 1 },
    {
      headerName: 'Total Amount',
      field: 'totalAmount',
      flex: 1,
      valueFormatter: (params: any) => formatCurrency(params.value),
    },
    { headerName: 'Item Count', field: 'itemCount', flex: 0.7 },
  ], [selectedIds, toggleSelection]);

  const selectedCount = selectedIds.size;

  return (
    <div style={{ padding: '2rem' }}>
      <Headline as="h1">Order Management ℹ️</Headline>

      <Panel style={{ marginTop: '1.5rem', padding: '1rem' }}>
        <Flex style={{ gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <SelectField
            label="Match Mode"
            value={quickFindMode}
            onChange={(v) => setQuickFindMode(v as QuickFindMode)}
            options={{
              values: ['startsWith', 'contains', 'endsWith'],
              getOptionName: (v) => {
                const labels: Record<string, string> = { startsWith: 'Starts With', contains: 'Contains', endsWith: 'Ends With' };
                return labels[v] || v;
              },
            }}
          />
          <TextField
            label="PO Number"
            value={quickFindValue}
            onChange={setQuickFindValue}
            placeholder="Enter PO number..."
            onKeyDown={(e) => e.key === 'Enter' && handleQuickFind()}
          />
          <Button onClick={handleQuickFind}>Search</Button>
          <Button variant="secondary" onClick={() => notificationService.info('Coming soon')}>Upload</Button>
        </Flex>
      </Panel>

      <Panel style={{ marginTop: '1rem', padding: '0.75rem 1rem' }}>
        <Flex spaceBetween style={{ alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Flex style={{ gap: '1rem', alignItems: 'center' }}>
            {selectedCount > 0 && (
              <span style={{ fontWeight: 500, fontSize: '14px' }}>{selectedCount} selected</span>
            )}
            {selectedCount > 0 && isAdmin && (
              <Button size="S" variant="secondary" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => setShowDeleteModal(true)}>Delete</Button>
            )}
            {selectedCount > 0 && (
              <>
                <Button size="S" variant="secondary" onClick={() => notificationService.info('Coming soon')}>Send</Button>
                <Button size="S" variant="secondary" onClick={() => notificationService.info('Coming soon')}>Cancel</Button>
              </>
            )}
          </Flex>
          <Flex style={{ gap: '0.75rem' }}>
            <Button size="S" variant="secondary" onClick={selectAll}>Select All</Button>
            <Button size="S" variant="secondary" onClick={clearSelection}>Clear Selection</Button>
            <Button size="S" onClick={() => notificationService.info('Coming soon')}>+ New Order</Button>
          </Flex>
        </Flex>
      </Panel>

      {loading ? (
        <Panel style={{ marginTop: '1.5rem', textAlign: 'center', padding: '3rem' }}>
          <Spinner />
        </Panel>
      ) : error ? (
        <div style={{ marginTop: '1.5rem' }}><ErrorState message={error} /></div>
      ) : orders.length === 0 ? (
        <Panel style={{ marginTop: '1.5rem', textAlign: 'center', padding: '3rem', color: 'var(--cool-gray-50)' }}>
          No orders found.
        </Panel>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <DataGrid
            rowData={orders}
            columnDefs={columnDefs}
            onGridReady={(params) => { gridRef.current = params.api; }}
          />
        </div>
      )}

      {showChooserModal && (
        <Modal title={`${chooserResults.length} Matching Orders`} onCloseClick={() => setShowChooserModal(false)}>
          <p style={{ marginBottom: '1rem', color: 'var(--cool-gray-50)' }}>Multiple orders match your search. Select one to highlight:</p>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {chooserResults.map((order) => (
              <div
                key={order.id}
                style={{
                  padding: '0.75rem', borderBottom: '1px solid var(--cool-gray-90)',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                }}
                onClick={() => {
                  setSelectedIds(new Set([order.id]));
                  setShowChooserModal(false);
                  notificationService.success(`Selected order ${order.orderNumber}`);
                }}
              >
                <span style={{ fontWeight: 500 }}>{order.orderNumber}</span>
                <span style={{ color: 'var(--cool-gray-50)' }}>{order.retailerName} — {formatCurrency(order.totalAmount)}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'right', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setShowChooserModal(false)}>Close</Button>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal title="Delete Orders" onCloseClick={() => setShowDeleteModal(false)}>
          <div style={{ position: 'relative' }}>
            {isDeleting && (
              <div className="confirm-modal-spinner-overlay"><Spinner /></div>
            )}
            <p style={{ marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong>{selectedCount}</strong> selected order(s)? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Cancel</Button>
              <Button onClick={handleBatchDelete} disabled={isDeleting}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
