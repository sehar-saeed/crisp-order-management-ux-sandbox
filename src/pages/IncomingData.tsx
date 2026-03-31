import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Panel, Headline, Button, Flex, Spinner, Modal, Drawer,
  MultiSelectDropdown, DatepickerButton, DataGrid,
} from '../ui';
import {
  fetchIncomingData, fetchClientList, fetchRetailerList, fetchSupplierList,
  reprocessRecord, requeueRecord,
} from '../mock/api';
import { notificationService } from '../services/NotificationService';
import { ErrorState } from '../components/common/CommonComponents';
import type { DataRecord } from '../types/record';

interface FilterState {
  clients: string[];
  retailers: string[];
  suppliers: string[];
  sources: string[];
  dateReceived: { from: Date | undefined; to: Date | undefined };
  dateLastProcessed: { from: Date | undefined; to: Date | undefined };
}

const EMPTY_FILTERS: FilterState = {
  clients: [],
  retailers: [],
  suppliers: [],
  sources: [],
  dateReceived: { from: undefined, to: undefined },
  dateLastProcessed: { from: undefined, to: undefined },
};

const statusColors: Record<string, string> = {
  Complete: '#22c55e',
  Processing: '#f59e0b',
  Error: '#ef4444',
  Pending: '#3b82f6',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span style={{
    display: 'inline-block', padding: '2px 10px', borderRadius: '12px',
    fontSize: '12px', fontWeight: 600, color: '#fff',
    background: statusColors[status] || '#9aa5b1',
  }}>
    {status}
  </span>
);

const mockRawData = {
  header: { sender: 'ACME-EDI', receiver: 'CRISP-OMS', version: '4010' },
  segments: [
    'ISA*00*          *00*          *ZZ*ACMECORP       *ZZ*CRISP          *250320*0815*U*00401*000000001*0*P*>',
    'GS*PO*ACMECORP*CRISP*20250320*0815*1*X*004010',
    'ST*850*0001',
  ],
};

const mockPayloadData = {
  orderNumber: 'PO-2025-001',
  retailer: { name: 'Walmart', code: 'WMT' },
  supplier: { name: 'Acme Foods Corp', code: 'ACME' },
  items: [
    { sku: 'SKU-001', description: 'Organic Granola 16oz', qty: 100, unitPrice: 4.99 },
    { sku: 'SKU-002', description: 'Almond Butter 12oz', qty: 50, unitPrice: 7.49 },
  ],
};

export const IncomingData: React.FC = () => {
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [clientOptions, setClientOptions] = useState<{ label: string; value: string }[]>([]);
  const [retailerOptions, setRetailerOptions] = useState<{ label: string; value: string }[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<{ label: string; value: string }[]>([]);

  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [drawerRecord, setDrawerRecord] = useState<DataRecord | null>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'raw' | 'payload' | 'error'>('details');

  const [confirmAction, setConfirmAction] = useState<{ type: 'reprocess' | 'requeue'; record: DataRecord } | null>(null);
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [clients, retailers, suppliers] = await Promise.all([
          fetchClientList(), fetchRetailerList(), fetchSupplierList(),
        ]);
        setClientOptions(clients.map((c) => ({ label: c.clientName, value: c.clientShortCode })));
        setRetailerOptions(retailers.map((r) => ({ label: r.name, value: r.shortCode })));
        setSupplierOptions(suppliers.map((s) => ({ label: s.name, value: s.shortCode })));
      } catch {
        notificationService.error('Failed to load filter options');
      }
    })();
  }, []);

  const handleSearch = useCallback(async () => {
    const validationErrors: string[] = [];
    if (filters.clients.length === 0) validationErrors.push('Client is required');
    if (filters.sources.length === 0) validationErrors.push('Source is required');
    if (!filters.dateReceived.from && !filters.dateReceived.to) validationErrors.push('Date Received is required');

    if (validationErrors.length > 0) {
      validationErrors.forEach((msg) => notificationService.warning(msg));
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedIds(new Set());
    try {
      const apiFilters: Record<string, string> = {};
      if (filters.clients.length === 1) apiFilters.clientShortCode = filters.clients[0];
      if (filters.retailers.length === 1) apiFilters.retailerShortCode = filters.retailers[0];
      if (filters.suppliers.length === 1) apiFilters.supplierShortCode = filters.suppliers[0];
      if (filters.sources.length === 1) apiFilters.source = filters.sources[0];

      let results = await fetchIncomingData(apiFilters);

      if (filters.clients.length > 1) {
        results = results.filter((r) => filters.clients.includes(r.clientShortCode));
      }
      if (filters.retailers.length > 1) {
        results = results.filter((r) => filters.retailers.includes(r.retailerShortCode));
      }
      if (filters.suppliers.length > 1) {
        results = results.filter((r) => filters.suppliers.includes(r.supplierShortCode));
      }
      if (filters.sources.length > 1) {
        results = results.filter((r) => filters.sources.includes(r.source));
      }

      if (filters.dateReceived.from) {
        const from = filters.dateReceived.from.getTime();
        results = results.filter((r) => new Date(r.recvDate).getTime() >= from);
      }
      if (filters.dateReceived.to) {
        const to = filters.dateReceived.to.getTime() + 86400000;
        results = results.filter((r) => new Date(r.recvDate).getTime() < to);
      }
      if (filters.dateLastProcessed.from) {
        const from = filters.dateLastProcessed.from.getTime();
        results = results.filter((r) => new Date(r.lastProcessDate).getTime() >= from);
      }
      if (filters.dateLastProcessed.to) {
        const to = filters.dateLastProcessed.to.getTime() + 86400000;
        results = results.filter((r) => new Date(r.lastProcessDate).getTime() < to);
      }

      setRecords(results);
      setHasSearched(true);
      notificationService.success(`Found ${results.length} record(s)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setIsActionProcessing(true);
    try {
      if (confirmAction.type === 'reprocess') {
        const result = await reprocessRecord(confirmAction.record.dataInUid);
        if (result.success) notificationService.success(result.message);
        else notificationService.error(result.message);
      } else {
        const result = await requeueRecord(confirmAction.record.dataInUid);
        if (result.success) notificationService.success(result.message);
        else notificationService.error(result.message);
      }
    } catch (err) {
      notificationService.error('Action failed');
    } finally {
      setIsActionProcessing(false);
      setConfirmAction(null);
    }
  };

  const handleBulkRequeue = async () => {
    const ids = Array.from(selectedIds);
    notificationService.info(`Requeueing ${ids.length} records...`);
    let successCount = 0;
    for (const id of ids) {
      try {
        const result = await requeueRecord(id);
        if (result.success) successCount++;
      } catch { /* continue */ }
    }
    notificationService.success(`${successCount} of ${ids.length} records requeued successfully`);
    setSelectedIds(new Set());
  };

  const hasClient = filters.clients.length > 0;

  const columnDefs = useMemo(() => [
    {
      headerName: '',
      field: 'dataInUid',
      width: 50,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => (
        <div className="row-action-button-wrapper">
          <input
            type="checkbox"
            checked={selectedIds.has(params.data.dataInUid)}
            onChange={() => toggleSelection(params.data.dataInUid)}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
        </div>
      ),
    },
    { headerName: 'Client', field: 'clientShortCode', flex: 0.8 },
    { headerName: 'Retailer', field: 'retailerShortCode', flex: 0.8 },
    { headerName: 'Supplier', field: 'supplierShortCode', flex: 0.8 },
    { headerName: 'Source', field: 'source', flex: 0.7 },
    { headerName: 'Payload Type', field: 'payloadType', flex: 0.8 },
    {
      headerName: 'Date Received',
      field: 'recvDate',
      flex: 1.2,
      valueFormatter: (params: any) => new Date(params.value).toLocaleString(),
    },
    {
      headerName: 'Date Last Processed',
      field: 'lastProcessDate',
      flex: 1.2,
      valueFormatter: (params: any) => new Date(params.value).toLocaleString(),
    },
    {
      headerName: 'Status',
      field: 'status',
      flex: 0.8,
      cellRenderer: (params: any) => <StatusBadge status={params.value} />,
    },
    {
      headerName: 'Action',
      field: 'dataInUid',
      flex: 0.7,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => (
        <Button size="S" variant="text" onClick={(e) => { e.stopPropagation(); setDrawerRecord(params.data); setDrawerTab('details'); }}>
          View
        </Button>
      ),
    },
  ], [selectedIds, toggleSelection]);

  return (
    <div style={{ padding: '2rem' }}>
      <Headline as="h1">Incoming Data</Headline>

      <Panel style={{ marginTop: '1.5rem', padding: '1rem' }}>
        <Flex style={{ gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <MultiSelectDropdown
            label="Client"
            options={clientOptions}
            selectedValues={filters.clients}
            onChange={(v) => setFilters((f) => ({ ...f, clients: v }))}
            features={{ search: true, clear: true }}
          />
          <MultiSelectDropdown
            label="Retailer"
            options={retailerOptions}
            selectedValues={filters.retailers}
            onChange={(v) => setFilters((f) => ({ ...f, retailers: v }))}
            disabled={!hasClient}
            features={{ search: true, clear: true }}
          />
          <MultiSelectDropdown
            label="Supplier"
            options={supplierOptions}
            selectedValues={filters.suppliers}
            onChange={(v) => setFilters((f) => ({ ...f, suppliers: v }))}
            disabled={!hasClient}
            features={{ search: true, clear: true }}
          />
          <MultiSelectDropdown
            label="Source"
            options={['EDI', 'Upload']}
            selectedValues={filters.sources}
            onChange={(v) => setFilters((f) => ({ ...f, sources: v }))}
          />
          <DatepickerButton
            label="Date Received"
            selected={filters.dateReceived}
            onSelect={(v) => setFilters((f) => ({ ...f, dateReceived: v }))}
            mode="range"
          />
          <DatepickerButton
            label="Date Last Processed"
            selected={filters.dateLastProcessed}
            onSelect={(v) => setFilters((f) => ({ ...f, dateLastProcessed: v }))}
            mode="range"
          />
          <Button onClick={handleSearch} disabled={loading}>Search Records</Button>
        </Flex>
      </Panel>

      {loading ? (
        <Panel style={{ marginTop: '1.5rem', textAlign: 'center', padding: '3rem' }}>
          <Spinner />
        </Panel>
      ) : error ? (
        <div style={{ marginTop: '1.5rem' }}><ErrorState message={error} /></div>
      ) : !hasSearched ? (
        <Panel style={{ marginTop: '1.5rem', textAlign: 'center', padding: '3rem', color: 'var(--cool-gray-50)' }}>
          Use the filters above and click "Search Records" to view incoming data.
        </Panel>
      ) : records.length === 0 ? (
        <Panel style={{ marginTop: '1.5rem', textAlign: 'center', padding: '3rem', color: 'var(--cool-gray-50)' }}>
          No records found matching the selected filters.
        </Panel>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <DataGrid
            rowData={records}
            columnDefs={columnDefs}
            onRowClicked={(e) => { setDrawerRecord(e.data); setDrawerTab('details'); }}
            rowStyle={{ cursor: 'pointer' }}
          />
        </div>
      )}

      {selectedIds.size >= 2 && (
        <div className="bulk-requeue-block">
          <span style={{ fontWeight: 500 }}>{selectedIds.size} records selected</span>
          <Button onClick={handleBulkRequeue}>Bulk Requeue Selected</Button>
        </div>
      )}

      {drawerRecord && (
        <Drawer
          title="Record Details"
          onCloseClick={() => setDrawerRecord(null)}
        >
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            {(['details', 'raw', 'payload', 'error'] as const).map((tab) => (
              <Button
                key={tab}
                size="S"
                variant={drawerTab === tab ? 'primary' : 'secondary'}
                onClick={() => setDrawerTab(tab)}
              >
                {tab === 'details' ? 'Details' : tab === 'raw' ? 'Raw Data' : tab === 'payload' ? 'Payload' : 'Error'}
              </Button>
            ))}
          </div>

          {drawerTab === 'details' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <DetailItem label="Record ID" value={drawerRecord.dataInUid} />
                <DetailItem label="Client" value={drawerRecord.clientShortCode} />
                <DetailItem label="Retailer" value={drawerRecord.retailerShortCode} />
                <DetailItem label="Supplier" value={drawerRecord.supplierShortCode} />
                <DetailItem label="Source" value={drawerRecord.source} />
                <DetailItem label="Payload Type" value={drawerRecord.payloadType} />
                <DetailItem label="Date Received" value={new Date(drawerRecord.recvDate).toLocaleString()} />
                <DetailItem label="Date Last Processed" value={new Date(drawerRecord.lastProcessDate).toLocaleString()} />
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '12px', color: 'var(--cool-gray-50)', textTransform: 'uppercase' }}>Status</span>
                <div style={{ marginTop: '4px' }}><StatusBadge status={drawerRecord.status} /></div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(drawerRecord.status === 'Complete' || drawerRecord.status === 'Error') && (
                  <Button size="S" onClick={() => setConfirmAction({ type: 'reprocess', record: drawerRecord })}>Reprocess</Button>
                )}
                {drawerRecord.status === 'Error' && (
                  <Button size="S" variant="secondary" onClick={() => setConfirmAction({ type: 'requeue', record: drawerRecord })}>Requeue</Button>
                )}
                <Button size="S" variant="secondary" onClick={() => setDrawerTab('error')}>View Error Message</Button>
                <Button size="S" variant="secondary" onClick={() => setDrawerTab('raw')}>View Raw Data</Button>
                <Button size="S" variant="secondary" onClick={() => setDrawerTab('payload')}>View Payload Data</Button>
              </div>
            </div>
          )}

          {drawerTab === 'raw' && (
            <div className="data-display-panel">
              <Headline as="h3">Raw Data</Headline>
              <pre className="data-display-code-block" style={{ marginTop: '0.75rem' }}>
                {JSON.stringify(mockRawData, null, 2)}
              </pre>
            </div>
          )}

          {drawerTab === 'payload' && (
            <div className="data-display-panel">
              <Headline as="h3">Payload Data</Headline>
              <pre className="data-display-code-block" style={{ marginTop: '0.75rem' }}>
                {JSON.stringify(mockPayloadData, null, 2)}
              </pre>
            </div>
          )}

          {drawerTab === 'error' && (
            <div className="data-display-panel">
              <Headline as="h3">Error Message</Headline>
              <pre className="data-display-code-block" style={{ marginTop: '0.75rem' }}>
                {drawerRecord.status === 'Error'
                  ? JSON.stringify({
                      errorCode: 'PARSE_FAILED',
                      message: 'Unable to parse EDI segment at position 47: unexpected delimiter',
                      timestamp: drawerRecord.lastProcessDate,
                      recordId: drawerRecord.dataInUid,
                    }, null, 2)
                  : 'No error messages for this record.'}
              </pre>
            </div>
          )}
        </Drawer>
      )}

      {confirmAction && (
        <Modal
          title={confirmAction.type === 'reprocess' ? 'Confirm Reprocess' : 'Confirm Requeue'}
          onCloseClick={() => setConfirmAction(null)}
        >
          <div style={{ position: 'relative' }}>
            {isActionProcessing && (
              <div className="confirm-modal-spinner-overlay"><Spinner /></div>
            )}
            <p style={{ marginBottom: '1rem' }}>
              Are you sure you want to {confirmAction.type} record{' '}
              <strong>{confirmAction.record.dataInUid}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setConfirmAction(null)} disabled={isActionProcessing}>Cancel</Button>
              <Button onClick={handleConfirmAction} disabled={isActionProcessing}>
                {confirmAction.type === 'reprocess' ? 'Reprocess' : 'Requeue'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '12px', color: 'var(--cool-gray-50)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontSize: '14px', marginTop: '2px', wordBreak: 'break-all' }}>{value}</div>
  </div>
);
