import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headline, Spinner, Panel, Button, Flex, Modal } from '../../ui';
import { useBrowseConfig } from '../../hooks/useBrowseConfig';
import { useOrderPagination } from '../../hooks/useOrderPagination';
import { fetchOrders, setSimulateOrderError } from '../../mock/api';
import { buildGridPayload, getSecurityExcludedFields } from '../../mock/buildGridPayload';
import { notificationService } from '../../services/NotificationService';
import { QuickFindBar } from '../../components/orders/QuickFindBar';
import { BulkActionBar } from '../../components/orders/BulkActionBar';
import { OrderFooter } from '../../components/orders/OrderFooter';
import { FilterPanel, applyOrderFilters, hasActiveFilters, EMPTY_FILTERS } from '../../components/orders/FilterPanel';
import type { OrderFilters } from '../../components/orders/FilterPanel';
import { ConfigDrivenGrid } from '../../components/table/ConfigDrivenGrid';
import { QuickFindChooserModal } from '../../components/modals/QuickFindChooserModal';
import { ColumnCustomizationDrawer } from '../../components/modals/ColumnCustomizationDrawer';
import type { OrderBrowseRow, QuickFindMode } from '../../types/order';
import '../../styles/order-browse.css';

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const SKELETON_COL_WIDTHS = [48, 130, 150, 110, 100, 110, 100, 110];

const TableSkeleton: React.FC = () => (
  <div className="ob-skeleton" aria-busy="true" aria-label="Loading orders">
    <div className="ob-skeleton__header">
      {SKELETON_COL_WIDTHS.map((w, i) => (
        <div key={i} className="ob-skeleton__cell ob-skeleton__cell--header" style={{ width: w }} />
      ))}
    </div>
    {Array.from({ length: 8 }, (_, rowIdx) => (
      <div key={rowIdx} className="ob-skeleton__row">
        {SKELETON_COL_WIDTHS.map((w, colIdx) => (
          <div
            key={colIdx}
            className="ob-skeleton__cell"
            style={{ width: colIdx === 0 ? w : w * (0.55 + (((rowIdx * 7 + colIdx * 3) % 10) / 20)) }}
          />
        ))}
      </div>
    ))}
  </div>
);

export const OrderBrowsePage: React.FC = () => {
  const navigate = useNavigate();
  const gridRef = useRef<any>(null);

  const [allOrders, setAllOrders] = useState<OrderBrowseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllPages, setSelectAllPages] = useState(false);
  const [quickFindMode, setQuickFindMode] = useState<QuickFindMode>('startsWith');
  const [quickFindValue, setQuickFindValue] = useState('');

  const [filters, setFilters] = useState<OrderFilters>({ ...EMPTY_FILTERS });
  const [showFilters, setShowFilters] = useState(false);

  const [showChooser, setShowChooser] = useState(false);
  const [chooserResults, setChooserResults] = useState<OrderBrowseRow[]>([]);
  const [showColumnDrawer, setShowColumnDrawer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    masterFields,
    clientOverrides,
    visibleColumns,
    applyOverrides,
    resetAllOverrides,
  } = useBrowseConfig();

  const filteredOrders = useMemo(
    () => applyOrderFilters(allOrders, filters),
    [allOrders, filters]
  );

  const pagination = useOrderPagination(filteredOrders);

  /**
   * Build the backend contract payload from resolved columns + page rows.
   * This simulates what the server would deliver: grid metadata + positional rows.
   * The grid component receives ONLY this payload — no keyed objects.
   */
  const gridPayload = useMemo(
    () => buildGridPayload(visibleColumns, pagination.paginatedOrders, {
      idField: 'id',
      excludedFieldIds: [...getSecurityExcludedFields()],
    }),
    [visibleColumns, pagination.paginatedOrders],
  );

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOrders();
      setAllOrders(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showColumnDrawer) return;
        if (showChooser) { setShowChooser(false); return; }
        if (showDeleteModal) { setShowDeleteModal(false); return; }
        if (showFilters) { setShowFilters(false); return; }
      }
      if (e.key === 'ArrowLeft' && e.altKey) {
        e.preventDefault();
        pagination.goToPage(pagination.currentPage - 1);
      }
      if (e.key === 'ArrowRight' && e.altKey) {
        e.preventDefault();
        pagination.goToPage(pagination.currentPage + 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showColumnDrawer, showChooser, showDeleteModal, showFilters, pagination]);

  const toggleSelection = useCallback((id: string) => {
    setSelectAllPages(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAllCurrentPage = () => {
    setSelectAllPages(false);
    setSelectedIds(new Set(pagination.paginatedOrders.map((o) => o.id)));
  };

  const selectAllAcrossPages = () => {
    setSelectAllPages(true);
    setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
  };

  const clearSelection = () => {
    setSelectAllPages(false);
    setSelectedIds(new Set());
  };

  const handleToggleSelectAll = () => {
    const pageIds = pagination.paginatedOrders.map((o) => o.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    if (allPageSelected) {
      clearSelection();
    } else {
      selectAllCurrentPage();
    }
  };

  const handleQuickFind = () => {
    const term = quickFindValue.trim().toLowerCase();
    if (!term) {
      notificationService.warning('Please enter a PO number to search');
      return;
    }

    const matches = allOrders.filter((o) => {
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
      navigate(`/orders/${matches[0].id}`);
    } else {
      setChooserResults(matches);
      setShowChooser(true);
    }
  };

  const handleChooserSelect = (order: OrderBrowseRow) => {
    setShowChooser(false);
    navigate(`/orders/${order.id}`);
  };

  const handleRowClick = (rowId: string) => {
    navigate(`/orders/${rowId}`);
  };

  const handleBatchDelete = async () => {
    const ids = [...selectedIds];
    console.log('[Bulk Delete]', { count: ids.length, orderIds: ids });
    setIsDeleting(true);
    await new Promise((r) => setTimeout(r, 600));
    setAllOrders((prev) => prev.filter((o) => !selectedIds.has(o.id)));
    const count = selectedIds.size;
    clearSelection();
    setShowDeleteModal(false);
    setIsDeleting(false);
    notificationService.success(`${count} order(s) deleted`);
  };

  const handleSend = () => {
    const ids = [...selectedIds];
    console.log('[Bulk Send]', { count: ids.length, orderIds: ids });
    notificationService.success(`${selectedIds.size} order(s) sent`);
    clearSelection();
  };

  const handlePrint = () => {
    const ids = [...selectedIds];
    console.log('[Bulk Print]', { count: ids.length, orderIds: ids });
    notificationService.info(`Preparing print view for ${selectedIds.size} order(s)...`);
    setTimeout(() => window.print(), 300);
  };

  const handleSimulateError = () => {
    setSimulateOrderError(true);
    loadOrders();
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length;
  const isFiltered = hasActiveFilters(filters);
  const totalUnfilteredCount = allOrders.length;

  return (
    <div className="ob-page">
      <div className="ob-page__header">
        <div className="ob-page__header-row">
          <Headline as="h1">Orders</Headline>
          <button
            className="ob-dev-toggle"
            onClick={handleSimulateError}
            title="Developer tool: simulate a network error on next load"
          >
            Simulate Error
          </button>
        </div>
      </div>

      <QuickFindBar
        mode={quickFindMode}
        value={quickFindValue}
        onModeChange={setQuickFindMode}
        onValueChange={setQuickFindValue}
        onGo={handleQuickFind}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        activeFilterCount={activeFilterCount}
        onCustomizeColumns={() => setShowColumnDrawer(true)}
      />

      {showFilters && (
        <FilterPanel
          orders={allOrders}
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {isFiltered && (
        <div className="ob-active-filters">
          <span className="ob-active-filters__label">Active filters:</span>
          {filters.invoiceStatus && (
            <span className="ob-active-filters__chip">
              Invoice: {filters.invoiceStatus}
              <button onClick={() => setFilters((f) => ({ ...f, invoiceStatus: '' }))}>&times;</button>
            </span>
          )}
          {filters.shipmentStatus && (
            <span className="ob-active-filters__chip">
              Shipment: {filters.shipmentStatus}
              <button onClick={() => setFilters((f) => ({ ...f, shipmentStatus: '' }))}>&times;</button>
            </span>
          )}
          {filters.retailer && (
            <span className="ob-active-filters__chip">
              Retailer: {filters.retailer}
              <button onClick={() => setFilters((f) => ({ ...f, retailer: '' }))}>&times;</button>
            </span>
          )}
          {filters.dateFrom && (
            <span className="ob-active-filters__chip">
              From: {filters.dateFrom}
              <button onClick={() => setFilters((f) => ({ ...f, dateFrom: '' }))}>&times;</button>
            </span>
          )}
          {filters.dateTo && (
            <span className="ob-active-filters__chip">
              To: {filters.dateTo}
              <button onClick={() => setFilters((f) => ({ ...f, dateTo: '' }))}>&times;</button>
            </span>
          )}
          <Button size="S" variant="text" onClick={() => setFilters({ ...EMPTY_FILTERS })}>
            Clear all
          </Button>
        </div>
      )}

      <BulkActionBar
        selectedCount={selectedIds.size}
        totalCount={pagination.paginatedOrders.length}
        totalFilteredCount={filteredOrders.length}
        selectAllPages={selectAllPages}
        onSelectAll={selectAllCurrentPage}
        onSelectAllPages={selectAllAcrossPages}
        onClearSelection={clearSelection}
        onDelete={() => setShowDeleteModal(true)}
        onSend={handleSend}
        onPrint={handlePrint}
      />

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <Panel className="ob-state-card ob-state-card--error">
          <div className="ob-state-card__icon ob-state-card__icon--error">!</div>
          <h3 className="ob-state-card__title">Unable to load orders</h3>
          <p className="ob-state-card__desc">{error}</p>
          <Button onClick={loadOrders}>Retry</Button>
        </Panel>
      ) : filteredOrders.length === 0 ? (
        <Panel className="ob-state-card ob-state-card--empty">
          <div className="ob-state-card__icon ob-state-card__icon--empty">
            {isFiltered ? '?' : '~'}
          </div>
          <h3 className="ob-state-card__title">
            {isFiltered ? 'No matching orders' : 'No orders yet'}
          </h3>
          <p className="ob-state-card__desc">
            {isFiltered
              ? 'No orders match the current filters. Try broadening your search criteria.'
              : 'Orders will appear here once they are created.'}
          </p>
          {isFiltered && (
            <Button variant="secondary" onClick={() => setFilters({ ...EMPTY_FILTERS })}>
              Clear all filters
            </Button>
          )}
        </Panel>
      ) : (
        <>
          <div className="ob-summary">
            <div className="ob-summary__stat">
              <span className="ob-summary__value">{filteredOrders.length}</span>
              <span className="ob-summary__label">
                {isFiltered ? `of ${totalUnfilteredCount} orders` : 'orders'}
              </span>
            </div>
            <div className="ob-summary__divider" />
            <div className="ob-summary__stat">
              <span className="ob-summary__value">{formatCurrency(pagination.totalAmount)}</span>
              <span className="ob-summary__label">total amount</span>
            </div>
          </div>

          <ConfigDrivenGrid
            columns={gridPayload.columns}
            rows={gridPayload.rows}
            rowIds={gridPayload.rowIds}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onToggleSelectAll={handleToggleSelectAll}
            onRowClick={handleRowClick}
            onGridReady={(params) => { gridRef.current = params.api; }}
          />

          <OrderFooter
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            pageSizeOptions={pagination.pageSizeOptions}
            totalOrders={pagination.totalOrders}
            totalAmount={pagination.totalAmount}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.changePageSize}
          />
        </>
      )}

      {showChooser && (
        <QuickFindChooserModal
          results={chooserResults}
          searchTerm={quickFindValue.trim()}
          searchMode={quickFindMode}
          onSelect={handleChooserSelect}
          onClose={() => setShowChooser(false)}
        />
      )}

      {showColumnDrawer && (
        <ColumnCustomizationDrawer
          masterFields={masterFields}
          clientOverrides={clientOverrides}
          onApply={applyOverrides}
          onResetAll={resetAllOverrides}
          onClose={() => setShowColumnDrawer(false)}
        />
      )}

      {showDeleteModal && (
        <Modal title="Delete Orders" onCloseClick={() => setShowDeleteModal(false)}>
          <div style={{ position: 'relative' }}>
            {isDeleting && (
              <div className="confirm-modal-spinner-overlay"><Spinner /></div>
            )}
            <p style={{ marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong>{selectedIds.size}</strong> selected order(s)?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button onClick={handleBatchDelete} disabled={isDeleting}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
