import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headline, Spinner, Panel, Button, Flex, Modal } from '../../ui';
import { useBrowseConfig } from '../../hooks/useBrowseConfig';
import { useSavedViews } from '../../hooks/useSavedViews';
import { useOrderPagination } from '../../hooks/useOrderPagination';
import { fetchOrders, setSimulateOrderError } from '../../mock/api';
import { buildGridPayload, getSecurityExcludedFields } from '../../mock/buildGridPayload';
import { notificationService } from '../../services/NotificationService';
import { QuickFindBar } from '../../components/orders/QuickFindBar';
import { BulkActionBar } from '../../components/orders/BulkActionBar';
import { OrderFooter } from '../../components/orders/OrderFooter';
import { ViewSelector } from '../../components/orders/ViewSelector';
import { FilterPanel, applyOrderFilters, hasActiveFilters, EMPTY_FILTERS } from '../../components/orders/FilterPanel';
import type { OrderFilters } from '../../components/orders/FilterPanel';
import { ConfigDrivenGrid } from '../../components/table/ConfigDrivenGrid';
import { QuickFindChooserModal } from '../../components/modals/QuickFindChooserModal';
import { ColumnCustomizationDrawer } from '../../components/modals/ColumnCustomizationDrawer';
import { SaveViewModal } from '../../components/modals/SaveViewModal';
import { SharedViewWarningModal } from '../../components/modals/SharedViewWarningModal';
import { ManageViewsModal } from '../../components/modals/ManageViewsModal';
import type { OrderBrowseRow, QuickFindMode } from '../../types/order';
import type { ViewScope } from '../../types/savedView';
import '../../styles/order-browse.css';
import '../../styles/saved-views.css';

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

  const [showSaveViewModal, setShowSaveViewModal] = useState(false);
  const [saveModalInitialName, setSaveModalInitialName] = useState('');
  const [saveModalForcedScope, setSaveModalForcedScope] = useState<ViewScope | undefined>(undefined);
  const [showSharedWarning, setShowSharedWarning] = useState(false);
  const [showManageViews, setShowManageViews] = useState(false);

  const {
    masterFields,
    clientOverrides,
    visibleColumns,
    applyOverrides,
    resetAllOverrides,
  } = useBrowseConfig();

  const {
    personalViews,
    sharedViews,
    activeView,
    activeViewId,
    selectView,
    saveView,
    updateView,
    deleteView,
    canEditView,
    getStartupConfig,
  } = useSavedViews();

  const startupAppliedRef = useRef(false);
  useEffect(() => {
    if (startupAppliedRef.current) return;
    startupAppliedRef.current = true;
    const startup = getStartupConfig();
    if (startup) {
      applyOverrides(startup.config);
      selectView(startup.viewId);
    }
  }, [getStartupConfig, applyOverrides, selectView]);

  const isViewModified = useMemo(() => {
    if (!activeView) return clientOverrides.length > 0;
    return JSON.stringify(clientOverrides) !== JSON.stringify(activeView.column_config);
  }, [activeView, clientOverrides]);

  const filteredOrders = useMemo(
    () => applyOrderFilters(allOrders, filters),
    [allOrders, filters]
  );

  const pagination = useOrderPagination(filteredOrders);

  const pageSelectedCount = useMemo(
    () => pagination.paginatedOrders.filter((o) => selectedIds.has(o.id)).length,
    [pagination.paginatedOrders, selectedIds],
  );

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

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showColumnDrawer) return;
        if (showSaveViewModal) { setShowSaveViewModal(false); return; }
        if (showSharedWarning) { setShowSharedWarning(false); return; }
        if (showManageViews) { setShowManageViews(false); return; }
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
  }, [showColumnDrawer, showChooser, showDeleteModal, showFilters, showSaveViewModal, showSharedWarning, showManageViews, pagination]);

  /* ── Selection ── */

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
    if (allPageSelected) clearSelection(); else selectAllCurrentPage();
  };

  /* ── Quick Find ── */

  const handleQuickFind = () => {
    const term = quickFindValue.trim().toLowerCase();
    if (!term) { notificationService.warning('Please enter a PO number to search'); return; }
    const matches = allOrders.filter((o) => {
      const on = o.orderNumber.toLowerCase();
      switch (quickFindMode) {
        case 'startsWith': return on.startsWith(term);
        case 'endsWith': return on.endsWith(term);
        case 'contains': return on.includes(term);
      }
    });
    if (matches.length === 0) notificationService.warning(`No orders found matching "${quickFindValue}"`);
    else if (matches.length === 1) navigate(`/orders/${matches[0].id}`);
    else { setChooserResults(matches); setShowChooser(true); }
  };

  /* ── View Actions ── */

  const handleSelectView = (viewId: string) => {
    const allViews = [...personalViews, ...sharedViews];
    const view = allViews.find((v) => v.view_id === viewId);
    if (!view) return;
    applyOverrides(view.column_config);
    selectView(viewId);
    notificationService.success(`View "${view.name}" loaded`);
  };

  const handleSelectSystemDefault = () => {
    resetAllOverrides();
    selectView(null);
    notificationService.success('Switched to system default');
  };

  const openSaveNewView = () => {
    setSaveModalInitialName('');
    setSaveModalForcedScope(undefined);
    setShowSaveViewModal(true);
  };

  const openSaveAs = () => {
    setSaveModalInitialName(activeView ? `${activeView.name} (copy)` : '');
    setSaveModalForcedScope('personal');
    setShowSharedWarning(false);
    setShowSaveViewModal(true);
  };

  const handleSave = () => {
    if (!activeView) {
      openSaveNewView();
      return;
    }
    if (!canEditView(activeView)) {
      setShowSharedWarning(true);
      return;
    }
    updateView(activeView.view_id, { column_config: clientOverrides });
    notificationService.success(`View "${activeView.name}" saved`);
  };

  const handleSaveViewSubmit = (name: string, scope: ViewScope, isDefault: boolean) => {
    saveView({ name, scope, is_default: isDefault, column_config: clientOverrides });
    setShowSaveViewModal(false);
    notificationService.success(`View "${name}" saved`);
  };

  const handleDeleteView = (viewId: string) => {
    const allViews = [...personalViews, ...sharedViews];
    const view = allViews.find((v) => v.view_id === viewId);
    deleteView(viewId);
    if (view) notificationService.success(`View "${view.name}" deleted`);
  };

  const handleSetDefault = (viewId: string) => {
    updateView(viewId, { is_default: true });
    const allViews = [...personalViews, ...sharedViews];
    const view = allViews.find((v) => v.view_id === viewId);
    if (view) notificationService.success(`"${view.name}" set as default`);
  };

  /* ── Bulk Actions ── */

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
    console.log('[Bulk Send]', { count: selectedIds.size, orderIds: [...selectedIds] });
    notificationService.success(`${selectedIds.size} order(s) sent`);
    clearSelection();
  };

  const handlePrint = () => {
    console.log('[Bulk Print]', { count: selectedIds.size, orderIds: [...selectedIds] });
    notificationService.info(`Preparing print view for ${selectedIds.size} order(s)...`);
    setTimeout(() => window.print(), 300);
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length;
  const isFiltered = hasActiveFilters(filters);
  const totalUnfilteredCount = allOrders.length;

  return (
    <div className="ob-page">
      {/* ── Header ── */}
      <div className="ob-page__header">
        <div className="ob-page__header-row">
          <Flex style={{ alignItems: 'center', gap: '0.75rem' }}>
            <Headline as="h1">Orders</Headline>
            <div className="ob-view-bar">
              <ViewSelector
                personalViews={personalViews}
                sharedViews={sharedViews}
                activeView={activeView}
                isModified={isViewModified}
                onSelectView={handleSelectView}
                onSelectSystemDefault={handleSelectSystemDefault}
                onSaveNewView={openSaveNewView}
                onManageViews={() => setShowManageViews(true)}
              />
            </div>
          </Flex>
          <div className="ob-view-actions">
            {isViewModified && (
              <span className="ob-view-actions__unsaved">
                <span className="ob-view-actions__unsaved-dot" />
                Unsaved changes
              </span>
            )}
            <Button
              size="S"
              variant={isViewModified ? 'primary' : 'secondary'}
              onClick={handleSave}
              disabled={!isViewModified}
            >
              Save
            </Button>
            <Button size="S" variant="secondary" onClick={openSaveAs}>
              Save As
            </Button>
            <Button size="S" variant="text" onClick={() => setShowManageViews(true)}>
              Manage Views
            </Button>
            <Button size="S" onClick={() => navigate('/orders/new')}>
              + New Order
            </Button>
            <button
              className="ob-dev-toggle"
              onClick={() => { setSimulateOrderError(true); loadOrders(); }}
              title="Developer tool: simulate a network error on next load"
            >
              Simulate Error
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick Find ── */}
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

      {/* ── Filters ── */}
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
          <Button size="S" variant="text" onClick={() => setFilters({ ...EMPTY_FILTERS })}>Clear all</Button>
        </div>
      )}

      {/* ── Bulk Actions ── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        pageSelectedCount={pageSelectedCount}
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

      {/* ── Main Content ── */}
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
          <div className="ob-state-card__icon ob-state-card__icon--empty">{isFiltered ? '?' : '~'}</div>
          <h3 className="ob-state-card__title">{isFiltered ? 'No matching orders' : 'No orders yet'}</h3>
          <p className="ob-state-card__desc">
            {isFiltered
              ? 'No orders match the current filters. Try broadening your search criteria.'
              : 'Orders will appear here once they are created.'}
          </p>
          {isFiltered && (
            <Button variant="secondary" onClick={() => setFilters({ ...EMPTY_FILTERS })}>Clear all filters</Button>
          )}
        </Panel>
      ) : (
        <>
          <div className="ob-summary">
            <div className="ob-summary__stat">
              <span className="ob-summary__value">{filteredOrders.length}</span>
              <span className="ob-summary__label">{isFiltered ? `of ${totalUnfilteredCount} orders` : 'orders'}</span>
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
            onRowClick={(rowId) => navigate(`/orders/${rowId}`)}
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

      {/* ── Modals & Drawers ── */}

      {showChooser && (
        <QuickFindChooserModal
          results={chooserResults}
          searchTerm={quickFindValue.trim()}
          searchMode={quickFindMode}
          onSelect={(order) => { setShowChooser(false); navigate(`/orders/${order.id}`); }}
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

      {showSaveViewModal && (
        <SaveViewModal
          initialName={saveModalInitialName}
          forcedScope={saveModalForcedScope}
          onSave={handleSaveViewSubmit}
          onClose={() => setShowSaveViewModal(false)}
        />
      )}

      {showSharedWarning && activeView && (
        <SharedViewWarningModal
          viewName={activeView.name}
          onSaveAs={openSaveAs}
          onClose={() => setShowSharedWarning(false)}
        />
      )}

      {showManageViews && (
        <ManageViewsModal
          personalViews={personalViews}
          sharedViews={sharedViews}
          activeViewId={activeViewId}
          onSelectView={handleSelectView}
          onDeleteView={handleDeleteView}
          onSetDefault={handleSetDefault}
          canEdit={canEditView}
          onClose={() => setShowManageViews(false)}
        />
      )}

      {showDeleteModal && (
        <Modal title="Delete Orders" onCloseClick={() => setShowDeleteModal(false)}>
          <div style={{ position: 'relative' }}>
            {isDeleting && <div className="confirm-modal-spinner-overlay"><Spinner /></div>}
            <p style={{ marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong>{selectedIds.size}</strong> selected order(s)?
              This action cannot be undone.
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
