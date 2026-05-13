import React, { useState, useEffect, useCallback } from 'react';
import {
  Headline, Button, Flex, Spinner, Modal, Drawer,
  MultiSelectDropdown, DatepickerButton,
} from '../../ui';
import {
  fetchClientList,
  fetchRetailerList,
  fetchSupplierList,
  reprocessRecord,
  requeueRecord,
} from '../../mock/api';
import type { DataRecord } from '../../types/record';
import { notificationService } from '../../services/NotificationService';

export interface IngestionBrowseFilterValues {
  clients: string[];
  retailers: string[];
  suppliers: string[];
  sources: string[];
  dateReceived: { from: Date | undefined; to: Date | undefined };
}

export const EMPTY_INGESTION_BROWSE_FILTERS: IngestionBrowseFilterValues = {
  clients: [],
  retailers: [],
  suppliers: [],
  sources: [],
  dateReceived: { from: undefined, to: undefined },
};

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

export function applyIngestionBrowseFilters(
  records: DataRecord[],
  f: IngestionBrowseFilterValues,
): DataRecord[] {
  let results = records;
  if (f.clients.length > 0) {
    results = results.filter((r) => f.clients.includes(r.clientShortCode));
  }
  if (f.retailers.length > 0) {
    results = results.filter((r) => f.retailers.includes(r.retailerShortCode));
  }
  if (f.suppliers.length > 0) {
    results = results.filter((r) => f.suppliers.includes(r.supplierShortCode));
  }
  if (f.sources.length > 0) {
    results = results.filter((r) => f.sources.includes(r.source));
  }
  if (f.dateReceived.from) {
    const from = f.dateReceived.from.getTime();
    results = results.filter((r) => new Date(r.recvDate).getTime() >= from);
  }
  if (f.dateReceived.to) {
    const to = f.dateReceived.to.getTime() + 86400000;
    results = results.filter((r) => new Date(r.recvDate).getTime() < to);
  }
  return results;
}

interface IngestionBrowseFiltersPanelProps {
  filters: IngestionBrowseFilterValues;
  onFiltersChange: (next: IngestionBrowseFilterValues) => void;
  onClose: () => void;
}

export const IngestionBrowseFiltersPanel: React.FC<IngestionBrowseFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  onClose,
}) => {
  const [clientOptions, setClientOptions] = useState<{ label: string; value: string }[]>([]);
  const [retailerOptions, setRetailerOptions] = useState<{ label: string; value: string }[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<{ label: string; value: string }[]>([]);

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

  const hasClient = filters.clients.length > 0;

  return (
    <div className="ob-filter-panel ob-filter-panel--static" aria-label="Import filters">
      <div className="ob-filter-panel__body">
        <div className="ob-filter-panel__grid">
          <MultiSelectDropdown
            label="Client"
            options={clientOptions}
            selectedValues={filters.clients}
            onChange={(v) => onFiltersChange({ ...filters, clients: v })}
            features={{ search: true, clear: true }}
          />
          <MultiSelectDropdown
            label="Retailer"
            options={retailerOptions}
            selectedValues={filters.retailers}
            onChange={(v) => onFiltersChange({ ...filters, retailers: v })}
            disabled={!hasClient}
            features={{ search: true, clear: true }}
          />
          <MultiSelectDropdown
            label="Supplier"
            options={supplierOptions}
            selectedValues={filters.suppliers}
            onChange={(v) => onFiltersChange({ ...filters, suppliers: v })}
            disabled={!hasClient}
            features={{ search: true, clear: true }}
          />
          <MultiSelectDropdown
            label="Source"
            options={['EDI', 'Upload']}
            selectedValues={filters.sources}
            onChange={(v) => onFiltersChange({ ...filters, sources: v })}
          />
          <DatepickerButton
            label="Date received"
            selected={filters.dateReceived}
            onSelect={(v) => onFiltersChange({ ...filters, dateReceived: v })}
            mode="range"
          />
        </div>
      </div>
      <div className="ob-filter-panel__footer">
        <Button variant="secondary" onClick={() => { onFiltersChange({ ...EMPTY_INGESTION_BROWSE_FILTERS }); onClose(); }}>
          Clear All
        </Button>
        <Button onClick={onClose}>Apply Filters</Button>
      </div>
    </div>
  );
};

interface IngestionRecordDrawerProps {
  record: DataRecord | null;
  onClose: () => void;
  onRecordsMutated?: () => void;
}

export const IngestionRecordDrawer: React.FC<IngestionRecordDrawerProps> = ({
  record,
  onClose,
  onRecordsMutated,
}) => {
  const [drawerTab, setDrawerTab] = useState<'details' | 'raw' | 'payload' | 'error'>('details');
  const [confirmAction, setConfirmAction] = useState<'reprocess' | 'requeue' | null>(null);
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  useEffect(() => {
    if (record) setDrawerTab('details');
  }, [record]);

  const handleConfirmAction = useCallback(async () => {
    if (!record || !confirmAction) return;
    setIsActionProcessing(true);
    try {
      if (confirmAction === 'reprocess') {
        const result = await reprocessRecord(record.dataInUid);
        if (result.success) notificationService.success(result.message);
        else notificationService.error(result.message);
      } else {
        const result = await requeueRecord(record.dataInUid);
        if (result.success) notificationService.success(result.message);
        else notificationService.error(result.message);
      }
      onRecordsMutated?.();
    } catch {
      notificationService.error('Action failed');
    } finally {
      setIsActionProcessing(false);
      setConfirmAction(null);
    }
  }, [record, confirmAction, onRecordsMutated]);

  if (!record) return null;

  return (
    <>
      <Drawer title="Import record" onCloseClick={onClose}>
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['details', 'raw', 'payload', 'error'] as const).map((tab) => (
            <Button
              key={tab}
              size="S"
              variant={drawerTab === tab ? 'primary' : 'secondary'}
              onClick={() => setDrawerTab(tab)}
            >
              {tab === 'details' ? 'Details' : tab === 'raw' ? 'Raw data' : tab === 'payload' ? 'Payload' : 'Error'}
            </Button>
          ))}
        </div>

        {drawerTab === 'details' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <DetailItem label="Record ID" value={record.dataInUid} />
              <DetailItem label="Client" value={record.clientShortCode} />
              <DetailItem label="Retailer" value={record.retailerShortCode} />
              <DetailItem label="Supplier" value={record.supplierShortCode} />
              <DetailItem label="Source" value={record.source} />
              <DetailItem label="Payload type" value={record.payloadType} />
              <DetailItem label="Date received" value={new Date(record.recvDate).toLocaleString()} />
              <DetailItem label="Last processed" value={new Date(record.lastProcessDate).toLocaleString()} />
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <span style={{ fontSize: '12px', color: 'var(--cool-gray-50)', textTransform: 'uppercase' }}>Status</span>
              <div style={{ marginTop: '4px' }}><span className={`ob-status ob-status--${record.status.toLowerCase()}`}>{record.status}</span></div>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(record.status === 'Complete' || record.status === 'Error') && (
                <Button size="S" onClick={() => setConfirmAction('reprocess')}>Reprocess</Button>
              )}
              {record.status === 'Error' && (
                <Button size="S" variant="secondary" onClick={() => setConfirmAction('requeue')}>Requeue</Button>
              )}
              <Button size="S" variant="secondary" onClick={() => setDrawerTab('error')}>View error message</Button>
              <Button size="S" variant="secondary" onClick={() => setDrawerTab('raw')}>View raw data</Button>
              <Button size="S" variant="secondary" onClick={() => setDrawerTab('payload')}>View payload</Button>
            </div>
          </div>
        )}

        {drawerTab === 'raw' && (
          <div className="data-display-panel">
            <Headline as="h3">Raw data</Headline>
            <pre className="data-display-code-block" style={{ marginTop: '0.75rem' }}>
              {JSON.stringify(mockRawData, null, 2)}
            </pre>
          </div>
        )}

        {drawerTab === 'payload' && (
          <div className="data-display-panel">
            <Headline as="h3">Payload data</Headline>
            <pre className="data-display-code-block" style={{ marginTop: '0.75rem' }}>
              {JSON.stringify(mockPayloadData, null, 2)}
            </pre>
          </div>
        )}

        {drawerTab === 'error' && (
          <div className="data-display-panel">
            <Headline as="h3">Error message</Headline>
            <pre className="data-display-code-block" style={{ marginTop: '0.75rem' }}>
              {record.status === 'Error'
                ? JSON.stringify({
                    errorCode: 'PARSE_FAILED',
                    message: 'Unable to parse EDI segment at position 47: unexpected delimiter',
                    timestamp: record.lastProcessDate,
                    recordId: record.dataInUid,
                  }, null, 2)
                : 'No error messages for this record.'}
            </pre>
          </div>
        )}
      </Drawer>

      {confirmAction && (
        <Modal
          title={confirmAction === 'reprocess' ? 'Confirm reprocess' : 'Confirm requeue'}
          onCloseClick={() => setConfirmAction(null)}
        >
          <div style={{ position: 'relative' }}>
            {isActionProcessing && (
              <div className="confirm-modal-spinner-overlay"><Spinner /></div>
            )}
            <p style={{ marginBottom: '1rem' }}>
              Are you sure you want to {confirmAction} record <strong>{record.dataInUid}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setConfirmAction(null)} disabled={isActionProcessing}>Cancel</Button>
              <Button onClick={handleConfirmAction} disabled={isActionProcessing}>
                {confirmAction === 'reprocess' ? 'Reprocess' : 'Requeue'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '12px', color: 'var(--cool-gray-50)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontSize: '14px', marginTop: '2px', wordBreak: 'break-all' }}>{value}</div>
  </div>
);
