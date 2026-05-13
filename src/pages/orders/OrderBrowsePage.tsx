import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Headline, Spinner, Panel, Button, Flex, Modal } from '../../ui';
import { useBrowseConfig } from '../../hooks/useBrowseConfig';
import { useIngestionBrowseConfig } from '../../hooks/useIngestionBrowseConfig';
import { useSavedViews } from '../../hooks/useSavedViews';
import { useOrderPagination } from '../../hooks/useOrderPagination';
import { useListPagination } from '../../hooks/useListPagination';
import {
  fetchOrders,
  fetchIncomingData,
  requeueRecord,
} from '../../mock/api';
import { buildGridPayload, getSecurityExcludedFields } from '../../mock/buildGridPayload';
import { notificationService } from '../../services/NotificationService';
import { QuickFindBar } from '../../components/orders/QuickFindBar';
import { BulkActionBar } from '../../components/orders/BulkActionBar';
import { OrderFooter } from '../../components/orders/OrderFooter';
import { ViewSelector } from '../../components/orders/ViewSelector';
import { FilterPanel, applyOrderFilters, hasActiveFilters, EMPTY_FILTERS } from '../../components/orders/FilterPanel';
import type { OrderFilters } from '../../components/orders/FilterPanel';
import {
  IngestionBrowseFiltersPanel,
  IngestionRecordDrawer,
  applyIngestionBrowseFilters,
  EMPTY_INGESTION_BROWSE_FILTERS,
} from '../../components/orders/IngestionRecordDrawer';
import type { IngestionBrowseFilterValues } from '../../components/orders/IngestionRecordDrawer';
import { ConfigDrivenGrid } from '../../components/table/ConfigDrivenGrid';
import { ColumnCustomizationDrawer } from '../../components/modals/ColumnCustomizationDrawer';
import { SaveViewModal } from '../../components/modals/SaveViewModal';
import { SharedViewWarningModal } from '../../components/modals/SharedViewWarningModal';
import { ManageViewsModal } from '../../components/modals/ManageViewsModal';
import type { OrderBrowseRow } from '../../types/order';
import type { DataRecord } from '../../types/record';
import type { ViewScope } from '../../types/savedView';
import {
  SYSTEM_BROWSE_VIEW_OPTIONS,
  parseSystemBrowseView,
  systemViewIsIngestion,
  applySystemViewToOrders,
  type SystemBrowseViewId,
} from '../../components/orders/systemBrowseViews';
import '../../styles/order-browse.css';
import '../../styles/saved-views.css';

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function countIngestionBrowseFilters(f: IngestionBrowseFilterValues): number {
  let n = 0;
  if (f.clients.length) n += 1;
  if (f.retailers.length) n += 1;
  if (f.suppliers.length) n += 1;
  if (f.sources.length) n += 1;
  if (f.dateReceived.from || f.dateReceived.to) n += 1;
  return n;
}

function matchesKeywordSearch(values: Array<string | number | null | undefined>, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = values
    .filter((v) => v !== null && v !== undefined)
    .map(String)
    .join(' ')
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

function matchesOrderSearch(order: OrderBrowseRow, query: string): boolean {
  return matchesKeywordSearch([
    order.id,
    order.orderNumber,
    order.retailerName,
    order.supplierName,
    order.orderDate,
    order.shipDate,
    order.invoiceStatus,
    order.shipmentStatus,
    order.commStatus,
    order.totalAmount,
    order.itemCount,
  ], query);
}

function matchesIngestionSearch(record: DataRecord, query: string): boolean {
  return matchesKeywordSearch([
    record.dataInUid,
    record.clientShortCode,
    record.retailerShortCode,
    record.supplierShortCode,
    record.source,
    record.payloadType,
    record.recvDate,
    record.lastProcessDate,
    record.status,
  ], query);
}

const SKELETON_COL_WIDTHS = [48, 130, 150, 110, 100, 110, 100, 110];

const TableSkeleton: React.FC = () => (
  <div className="ob-skeleton" aria-busy="true" aria-label="Loading">
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
  const [searchParams, setSearchParams] = useSearchParams();
  const gridRef = useRef<any>(null);
  const legacyNormalizedRef = useRef(false);

  const systemView = parseSystemBrowseView(searchParams.get('view'));
  const isIngestionBrowse = systemViewIsIngestion(systemView);

  const setSystemView = useCallback((id: SystemBrowseViewId) => {
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev);
      ['workspace', 'orderView', 'importView', 'view'].forEach((k) => n.delete(k));
      if (id !== 'all') n.set('view', id);
      return n;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    if (legacyNormalizedRef.current) return;
    const w = searchParams.get('workspace');
    const ov = searchParams.get('orderView');
    const iv = searchParams.get('importView');
    if (!w && !ov && !iv) return;
    legacyNormalizedRef.current = true;
    let next: SystemBrowseViewId = 'all';
    if (w === 'ingestion' || (iv && iv !== 'all')) {
      next = 'failed_imports';
    } else if (ov) {
      const parsed = parseSystemBrowseView(ov);
      next = parsed === 'failed_imports' ? 'all' : parsed;
    }
    setSearchParams(() => {
      const n = new URLSearchParams();
      if (next !== 'all') n.set('view', next);
      return n;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  const [allOrders, setAllOrders] = useState<OrderBrowseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ingestionRaw, setIngestionRaw] = useState<DataRecord[]>([]);
  const [ingestionLoading, setIngestionLoading] = useState(false);
  const [ingestionError, setIngestionError] = useState<string | null>(null);
  const [ingestionBrowseFilters, setIngestionBrowseFilters] = useState<IngestionBrowseFilterValues>({
    ...EMPTY_INGESTION_BROWSE_FILTERS,
  });
  const [ingestionDrawerRecord, setIngestionDrawerRecord] = useState<DataRecord | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllPages, setSelectAllPages] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const [filters, setFilters] = useState<OrderFilters>({ ...EMPTY_FILTERS });
  const [showFilters, setShowFilters] = useState(false);

  const [showColumnDrawer, setShowColumnDrawer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showSaveViewModal, setShowSaveViewModal] = useState(false);
  const [saveModalInitialName, setSaveModalInitialName] = useState('');
  const [saveModalForcedScope, setSaveModalForcedScope] = useState<ViewScope | undefined>(undefined);
  const [showSharedWarning, setShowSharedWarning] = useState(false);
  const [showManageViews, setShowManageViews] = useState(false);

  const {
    masterFields: orderMasterFields,
    clientOverrides,
    visibleColumns: orderVisibleColumns,
    applyOverrides,
    resetAllOverrides,
  } = useBrowseConfig();

  const {
    masterFields: ingestionMasterFields,
    clientOverrides: ingestionClientOverrides,
    visibleColumns: ingestionVisibleColumns,
    applyOverrides: applyIngestionOverrides,
    resetAllOverrides: resetIngestionOverrides,
  } = useIngestionBrowseConfig();

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
      const hasExplicitView = searchParams.has('view')
        || searchParams.has('workspace')
        || searchParams.has('orderView')
        || searchParams.has('importView');
      if (!hasExplicitView) setSystemView(startup.system_view_id);
      applyOverrides(startup.column_config);
      applyIngestionOverrides(startup.ingestion_column_config);
      selectView(startup.viewId);
    }
  }, [getStartupConfig, applyOverrides, applyIngestionOverrides, selectView, searchParams, setSystemView]);

  const activeIngestionConfig = activeView?.ingestion_column_config ?? [];

  const isViewModified = useMemo(() => {
    if (!activeView) {
      return clientOverrides.length > 0 || ingestionClientOverrides.length > 0;
    }
    return (
      (activeView.system_view_id ?? 'all') !== systemView
      || JSON.stringify(clientOverrides) !== JSON.stringify(activeView.column_config)
      || JSON.stringify(ingestionClientOverrides) !== JSON.stringify(activeIngestionConfig)
    );
  }, [activeView, clientOverrides, ingestionClientOverrides, activeIngestionConfig, systemView]);

  const filteredOrders = useMemo(() => {
    if (isIngestionBrowse) return [];
    return applySystemViewToOrders(applyOrderFilters(allOrders, filters), systemView)
      .filter((order) => matchesOrderSearch(order, searchValue));
  }, [allOrders, filters, systemView, isIngestionBrowse, searchValue]);

  const filteredIngestion = useMemo(
    () => applyIngestionBrowseFilters(ingestionRaw, ingestionBrowseFilters)
      .filter((record) => matchesIngestionSearch(record, searchValue)),
    [ingestionRaw, ingestionBrowseFilters, searchValue],
  );

  const pagination = useOrderPagination(filteredOrders);
  const ingestionPagination = useListPagination(filteredIngestion);

  const pageNav = isIngestionBrowse ? ingestionPagination : pagination;

  const pageSelectedCount = useMemo(() => {
    if (isIngestionBrowse) {
      return ingestionPagination.paginatedItems.filter((r) => selectedIds.has(r.dataInUid)).length;
    }
    return pagination.paginatedOrders.filter((o) => selectedIds.has(o.id)).length;
  }, [isIngestionBrowse, ingestionPagination.paginatedItems, pagination.paginatedOrders, selectedIds]);

  const orderGridPayload = useMemo(
    () => buildGridPayload(orderVisibleColumns, pagination.paginatedOrders, {
      idField: 'id',
      excludedFieldIds: [...getSecurityExcludedFields()],
    }),
    [orderVisibleColumns, pagination.paginatedOrders],
  );

  const ingestionKeyedRows = useMemo(
    () => ingestionPagination.paginatedItems.map((r) => ({ id: r.dataInUid, ...r })),
    [ingestionPagination.paginatedItems],
  );

  const ingestionGridPayload = useMemo(
    () => buildGridPayload(ingestionVisibleColumns, ingestionKeyedRows, {
      idField: 'id',
      excludedFieldIds: [...getSecurityExcludedFields()],
    }),
    [ingestionVisibleColumns, ingestionKeyedRows],
  );

  const activeGridPayload = isIngestionBrowse ? ingestionGridPayload : orderGridPayload;

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

  const reloadIngestion = useCallback(async () => {
    setIngestionLoading(true);
    setIngestionError(null);
    try {
      const rows = await fetchIncomingData({ status: 'Error' });
      setIngestionRaw(rows);
    } catch (err) {
      setIngestionError(err instanceof Error ? err.message : 'Failed to load import records');
    } finally {
      setIngestionLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    if (!isIngestionBrowse) return;
    reloadIngestion();
  }, [isIngestionBrowse, reloadIngestion]);

  useEffect(() => {
    setSelectedIds(new Set());
    setSelectAllPages(false);
  }, [systemView]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (ingestionDrawerRecord) {
          setIngestionDrawerRecord(null);
          return;
        }
        if (showColumnDrawer) return;
        if (showSaveViewModal) { setShowSaveViewModal(false); return; }
        if (showSharedWarning) { setShowSharedWarning(false); return; }
        if (showManageViews) { setShowManageViews(false); return; }
        if (showDeleteModal) { setShowDeleteModal(false); return; }
      }
      if (e.key === 'ArrowLeft' && e.altKey) {
        e.preventDefault();
        pageNav.goToPage(pageNav.currentPage - 1);
      }
      if (e.key === 'ArrowRight' && e.altKey) {
        e.preventDefault();
        pageNav.goToPage(pageNav.currentPage + 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    ingestionDrawerRecord,
    showColumnDrawer,
    showDeleteModal,
    showFilters,
    showSaveViewModal,
    showSharedWarning,
    showManageViews,
    pageNav,
  ]);

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
    if (isIngestionBrowse) {
      setSelectedIds(new Set(ingestionPagination.paginatedItems.map((r) => r.dataInUid)));
    } else {
      setSelectedIds(new Set(pagination.paginatedOrders.map((o) => o.id)));
    }
  };

  const selectAllAcrossPages = () => {
    setSelectAllPages(true);
    if (isIngestionBrowse) {
      setSelectedIds(new Set(filteredIngestion.map((r) => r.dataInUid)));
    } else {
      setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const clearSelection = () => {
    setSelectAllPages(false);
    setSelectedIds(new Set());
  };

  const handleToggleSelectAll = () => {
    const pageIds = isIngestionBrowse
      ? ingestionPagination.paginatedItems.map((r) => r.dataInUid)
      : pagination.paginatedOrders.map((o) => o.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    if (allPageSelected) clearSelection(); else selectAllCurrentPage();
  };

  const handleSelectView = (viewId: string) => {
    const allViews = [...personalViews, ...sharedViews];
    const view = allViews.find((v) => v.view_id === viewId);
    if (!view) return;
    setSystemView(view.system_view_id ?? 'all');
    applyOverrides(view.column_config);
    applyIngestionOverrides(view.ingestion_column_config ?? []);
    selectView(viewId);
    notificationService.success(`View "${view.name}" loaded`);
  };

  const handleSelectSystemView = (viewId: SystemBrowseViewId) => {
    setSystemView(viewId);
    resetAllOverrides();
    resetIngestionOverrides();
    setFilters({ ...EMPTY_FILTERS });
    setIngestionBrowseFilters({ ...EMPTY_INGESTION_BROWSE_FILTERS });
    selectView(null);
    const label = SYSTEM_BROWSE_VIEW_OPTIONS.find((v) => v.id === viewId)?.label ?? 'System view';
    notificationService.success(`Switched to ${label}`);
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
    updateView(activeView.view_id, {
      system_view_id: systemView,
      column_config: clientOverrides,
      ingestion_column_config: ingestionClientOverrides,
    });
    notificationService.success(`View "${activeView.name}" saved`);
  };

  const handleSaveViewSubmit = (name: string, scope: ViewScope, isDefault: boolean) => {
    saveView({
      name,
      scope,
      is_default: isDefault,
      system_view_id: systemView,
      column_config: clientOverrides,
      ingestion_column_config: ingestionClientOverrides,
    });
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

  const handleBatchDelete = async () => {
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
    notificationService.success(`${selectedIds.size} order(s) sent`);
    clearSelection();
  };

  const handlePrint = () => {
    notificationService.info(`Preparing print view for ${selectedIds.size} order(s)...`);
    setTimeout(() => window.print(), 300);
  };

  const handleBulkRequeueIngestion = async () => {
    const ids = [...selectedIds];
    notificationService.info(`Requeueing ${ids.length} records...`);
    let ok = 0;
    for (const id of ids) {
      try {
        const r = await requeueRecord(id);
        if (r.success) ok++;
      } catch { /* continue */ }
    }
    notificationService.success(`${ok} of ${ids.length} records requeued`);
    clearSelection();
    reloadIngestion();
  };

  const orderFilterCount = Object.values(filters).filter((v) => v !== '').length;
  const ingestionFilterCount = countIngestionBrowseFilters(ingestionBrowseFilters);
  const activeFilterCount = isIngestionBrowse ? ingestionFilterCount : orderFilterCount;

  const showActiveFilterStrip = (!isIngestionBrowse && hasActiveFilters(filters))
    || (isIngestionBrowse && ingestionFilterCount > 0)
    || searchValue.trim() !== '';

  const isOrderBrowseFiltered = hasActiveFilters(filters)
    || (systemView !== 'all' && !isIngestionBrowse)
    || searchValue.trim() !== '';

  useEffect(() => {
    const hasRelevantFilters = isIngestionBrowse
      ? ingestionFilterCount > 0
      : orderFilterCount > 0;
    if (hasRelevantFilters) setShowFilters(true);
  }, [isIngestionBrowse, ingestionFilterCount, orderFilterCount]);

  const clearAllBrowseState = () => {
    setSearchValue('');
    setFilters({ ...EMPTY_FILTERS });
    setIngestionBrowseFilters({ ...EMPTY_INGESTION_BROWSE_FILTERS });
    setSystemView('all');
  };

  const handleGridRowClick = (rowId: string) => {
    if (isIngestionBrowse) {
      const rec = filteredIngestion.find((r) => r.dataInUid === rowId);
      if (rec) setIngestionDrawerRecord(rec);
      return;
    }
    navigate(`/orders/${rowId}`);
  };

  const mainLoading = isIngestionBrowse ? ingestionLoading : loading;
  const mainError = isIngestionBrowse ? ingestionError : error;
  const mainEmptyCount = isIngestionBrowse ? filteredIngestion.length : filteredOrders.length;
  const hasIngestionRefinements = ingestionFilterCount > 0 || searchValue.trim() !== '';
  const summaryText = isIngestionBrowse
    ? `${filteredIngestion.length} import records`
    : `${filteredOrders.length} orders · ${formatCurrency(pagination.totalAmount)} total`;

  return (
    <div className="ob-page">
      <div className="ob-page__header">
        <div className="ob-page__header-row">
          <Flex style={{ alignItems: 'center', gap: '0.75rem' }}>
            <Headline as="h1">Orders</Headline>
            <div className="ob-view-bar">
              <ViewSelector
                systemViews={SYSTEM_BROWSE_VIEW_OPTIONS}
                activeSystemViewId={systemView}
                personalViews={personalViews}
                sharedViews={sharedViews}
                activeView={activeView}
                isModified={isViewModified}
                onSelectSystemView={handleSelectSystemView}
                onSelectView={handleSelectView}
                onSaveCurrent={handleSave}
                onSaveAs={openSaveAs}
                onManageViews={() => setShowManageViews(true)}
              />
            </div>
          </Flex>
          <div className="ob-view-actions">
            <Button size="S" onClick={() => navigate('/orders/new')}>
              + New Order
            </Button>
          </div>
        </div>
      </div>

      <div className="ob-status-row">
        <div className="ob-status-tabs" role="tablist" aria-label="Order status views">
          {SYSTEM_BROWSE_VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={systemView === opt.id}
              className={`ob-status-tab ${systemView === opt.id ? 'ob-status-tab--active' : ''}`}
              onClick={() => handleSelectSystemView(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="ob-status-summary" aria-live="polite">
          {summaryText}
        </div>
      </div>

      <QuickFindBar
        value={searchValue}
        onValueChange={setSearchValue}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        activeFilterCount={activeFilterCount}
        onCustomizeColumns={() => setShowColumnDrawer(true)}
        placeholder="Search by PO number, retailer, or order ID..."
      />

      {showFilters && (
        isIngestionBrowse ? (
          <IngestionBrowseFiltersPanel
            filters={ingestionBrowseFilters}
            onFiltersChange={setIngestionBrowseFilters}
            onClose={() => setShowFilters(false)}
          />
        ) : (
          <FilterPanel
            orders={allOrders}
            filters={filters}
            onFiltersChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        )
      )}

      {showActiveFilterStrip && (
        <div className="ob-active-filters">
          <span className="ob-active-filters__label">Active refinements:</span>
          {!isIngestionBrowse && filters.invoiceStatus && (
            <span className="ob-active-filters__chip">
              Invoice: {filters.invoiceStatus}
              <button type="button" onClick={() => setFilters((f) => ({ ...f, invoiceStatus: '' }))}>&times;</button>
            </span>
          )}
          {!isIngestionBrowse && filters.shipmentStatus && (
            <span className="ob-active-filters__chip">
              Shipment: {filters.shipmentStatus}
              <button type="button" onClick={() => setFilters((f) => ({ ...f, shipmentStatus: '' }))}>&times;</button>
            </span>
          )}
          {!isIngestionBrowse && filters.retailer && (
            <span className="ob-active-filters__chip">
              Retailer: {filters.retailer}
              <button type="button" onClick={() => setFilters((f) => ({ ...f, retailer: '' }))}>&times;</button>
            </span>
          )}
          {!isIngestionBrowse && filters.dateFrom && (
            <span className="ob-active-filters__chip">
              From: {filters.dateFrom}
              <button type="button" onClick={() => setFilters((f) => ({ ...f, dateFrom: '' }))}>&times;</button>
            </span>
          )}
          {!isIngestionBrowse && filters.dateTo && (
            <span className="ob-active-filters__chip">
              To: {filters.dateTo}
              <button type="button" onClick={() => setFilters((f) => ({ ...f, dateTo: '' }))}>&times;</button>
            </span>
          )}
          {searchValue.trim() !== '' && (
            <span className="ob-active-filters__chip">
              Search: {searchValue.trim()}
              <button type="button" onClick={() => setSearchValue('')} aria-label="Clear search">&times;</button>
            </span>
          )}
          {isIngestionBrowse && ingestionFilterCount > 0 && (
            <span className="ob-active-filters__chip">
              Import filters ({ingestionFilterCount})
              <button
                type="button"
                onClick={() => setIngestionBrowseFilters({ ...EMPTY_INGESTION_BROWSE_FILTERS })}
                aria-label="Clear import filters"
              >
                &times;
              </button>
            </span>
          )}
          <Button size="S" variant="text" onClick={clearAllBrowseState}>Clear all</Button>
        </div>
      )}

      <BulkActionBar
        variant={isIngestionBrowse ? 'ingestion' : 'orders'}
        selectedCount={selectedIds.size}
        pageSelectedCount={pageSelectedCount}
        totalCount={isIngestionBrowse ? ingestionPagination.paginatedItems.length : pagination.paginatedOrders.length}
        totalFilteredCount={isIngestionBrowse ? filteredIngestion.length : filteredOrders.length}
        selectAllPages={selectAllPages}
        onSelectAll={selectAllCurrentPage}
        onSelectAllPages={selectAllAcrossPages}
        onClearSelection={clearSelection}
        onDelete={() => setShowDeleteModal(true)}
        onSend={handleSend}
        onPrint={handlePrint}
        onBulkRequeue={handleBulkRequeueIngestion}
      />

      {mainLoading ? (
        <TableSkeleton />
      ) : mainError ? (
        <Panel className="ob-state-card ob-state-card--error">
          <div className="ob-state-card__icon ob-state-card__icon--error">!</div>
          <h3 className="ob-state-card__title">
            {isIngestionBrowse ? 'Unable to load import records' : 'Unable to load orders'}
          </h3>
          <p className="ob-state-card__desc">{mainError}</p>
          <Button onClick={isIngestionBrowse ? reloadIngestion : loadOrders}>Retry</Button>
        </Panel>
      ) : mainEmptyCount === 0 ? (
        <Panel className="ob-state-card ob-state-card--empty">
          <div className="ob-state-card__icon ob-state-card__icon--empty">
            {isIngestionBrowse || isOrderBrowseFiltered ? '?' : '~'}
          </div>
          <h3 className="ob-state-card__title">
            {isIngestionBrowse
              ? (hasIngestionRefinements ? 'No matching import records' : 'No failed imports')
              : (isOrderBrowseFiltered ? 'No matching orders' : 'No orders yet')}
          </h3>
          <p className="ob-state-card__desc">
            {isIngestionBrowse
              ? 'Try clearing import filters or confirm new error records exist.'
              : (isOrderBrowseFiltered
                ? 'No orders match the current filters or view. Try broadening filters or another view chip.'
                : 'Orders will appear here once they are created.')}
          </p>
          {(isIngestionBrowse ? hasIngestionRefinements : isOrderBrowseFiltered) && (
            <Button variant="secondary" onClick={clearAllBrowseState}>Clear all filters</Button>
          )}
        </Panel>
      ) : (
        <>
          <ConfigDrivenGrid
            columns={activeGridPayload.columns}
            rows={activeGridPayload.rows}
            rowIds={activeGridPayload.rowIds}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onToggleSelectAll={handleToggleSelectAll}
            onRowClick={handleGridRowClick}
            onGridReady={(params) => { gridRef.current = params.api; }}
          />

          <OrderFooter
            currentPage={pageNav.currentPage}
            totalPages={pageNav.totalPages}
            pageSize={pageNav.pageSize}
            pageSizeOptions={pageNav.pageSizeOptions}
            totalOrders={isIngestionBrowse ? ingestionPagination.totalCount : pagination.totalOrders}
            totalAmount={isIngestionBrowse ? 0 : pagination.totalAmount}
            onPageChange={pageNav.goToPage}
            onPageSizeChange={pageNav.changePageSize}
            summaryVariant={isIngestionBrowse ? 'records' : 'orders'}
          />
        </>
      )}

      {showColumnDrawer && (
        <ColumnCustomizationDrawer
          masterFields={isIngestionBrowse ? ingestionMasterFields : orderMasterFields}
          clientOverrides={isIngestionBrowse ? ingestionClientOverrides : clientOverrides}
          onApply={isIngestionBrowse ? applyIngestionOverrides : applyOverrides}
          onResetAll={isIngestionBrowse ? resetIngestionOverrides : resetAllOverrides}
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

      <IngestionRecordDrawer
        record={ingestionDrawerRecord}
        onClose={() => setIngestionDrawerRecord(null)}
        onRecordsMutated={reloadIngestion}
      />
    </div>
  );
};
