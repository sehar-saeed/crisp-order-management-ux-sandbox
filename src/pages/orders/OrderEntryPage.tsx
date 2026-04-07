import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Headline, Button, Flex, TextField, SearchableSelect } from '../../ui';
import type { SearchableOption } from '../../ui';
import { notificationService } from '../../services/NotificationService';
import { mockRetailers, mockSuppliers } from '../../mock/orders/mockParties';
import { useRepSplits } from '../../hooks/useRepSplits';
import { useOrderItems } from '../../hooks/useOrderItems';
import { useEntryFieldConfig } from '../../hooks/useEntryFieldConfig';
import { RepSplitsSection } from '../../components/orders/RepSplitsSection';
import { OrderItemsSection } from '../../components/orders/OrderItemsSection';
import type { ResolvedEntryField } from '../../types/entryFieldConfig';
import {
  ORDER_TYPES,
  EMPTY_ADDRESS,
  type OrderType,
  type Address,
  type MockParty,
} from '../../types/orderEntry';
import '../../styles/order-entry.css';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function formatAddress(addr: Address): React.ReactNode {
  const lines = [addr.name, addr.line1, addr.line2, `${addr.city}, ${addr.state} ${addr.zip}`].filter(Boolean);
  return (
    <>
      {lines.map((l, i) => (
        <React.Fragment key={i}>
          {l}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
}

function field(resolved: ResolvedEntryField[], id: string): ResolvedEntryField | undefined {
  return resolved.find((f) => f.field_id === id);
}

function isVisible(resolved: ResolvedEntryField[], id: string): boolean {
  return field(resolved, id)?.visible ?? false;
}

function caption(resolved: ResolvedEntryField[], id: string, fallback: string): string {
  return field(resolved, id)?.caption ?? fallback;
}

export const OrderEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const { header, txn } = useEntryFieldConfig();
  const hv = header.visible;

  const [orderType, setOrderType] = useState<OrderType>('purchase_order');
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(todayISO);
  const [isTestOrder, setIsTestOrder] = useState(false);

  const [fromPartyId, setFromPartyId] = useState('');
  const [toPartyId, setToPartyId] = useState('');

  const [shipToLocationId, setShipToLocationId] = useState('');
  const [billToAddress, setBillToAddress] = useState<Address>(EMPTY_ADDRESS);
  const [shipToAddress, setShipToAddress] = useState<Address>(EMPTY_ADDRESS);

  const typeOption = useMemo(
    () => ORDER_TYPES.find((t) => t.value === orderType)!,
    [orderType],
  );

  const isRetailerFrom = orderType === 'purchase_order' || orderType === 'return_auth';

  const fromParties: MockParty[] = isRetailerFrom ? mockRetailers : mockSuppliers;
  const toParties: MockParty[] = isRetailerFrom ? mockSuppliers : mockRetailers;

  const fromPartyOptions: SearchableOption[] = useMemo(
    () => fromParties.map((p) => ({ id: p.id, label: p.name })),
    [fromParties],
  );
  const toPartyOptions: SearchableOption[] = useMemo(
    () => toParties.map((p) => ({ id: p.id, label: p.name })),
    [toParties],
  );

  const fromParty = useMemo(
    () => fromParties.find((p) => p.id === fromPartyId) ?? null,
    [fromParties, fromPartyId],
  );
  const toParty = useMemo(
    () => toParties.find((p) => p.id === toPartyId) ?? null,
    [toParties, toPartyId],
  );

  const retailerParty = isRetailerFrom ? fromParty : toParty;
  const supplierParty = isRetailerFrom ? toParty : fromParty;

  const retailerId = retailerParty?.id ?? '';
  const supplierId = supplierParty?.id ?? '';
  const repSplits = useRepSplits(retailerId, supplierId);
  const orderItems = useOrderItems();

  const shipToLocations = useMemo(
    () => retailerParty?.locations ?? [],
    [retailerParty],
  );

  const shipToOptions: SearchableOption[] = useMemo(
    () => shipToLocations.map((l) => ({ id: l.id, label: l.name, secondary: `${l.address.city}, ${l.address.state}` })),
    [shipToLocations],
  );

  useEffect(() => {
    if (retailerParty) {
      setBillToAddress(retailerParty.billToAddress);
    } else {
      setBillToAddress(EMPTY_ADDRESS);
    }
  }, [retailerParty]);

  useEffect(() => {
    const loc = shipToLocations.find((l) => l.id === shipToLocationId);
    if (loc) {
      setShipToAddress(loc.address);
    } else {
      setShipToAddress(EMPTY_ADDRESS);
    }
  }, [shipToLocationId, shipToLocations]);

  const handleFromChange = useCallback(
    (id: string) => {
      setFromPartyId(id);
      setShipToLocationId('');
    },
    [],
  );

  const handleToChange = useCallback(
    (id: string) => {
      setToPartyId(id);
      setShipToLocationId('');
    },
    [],
  );

  const handleTypeChange = useCallback(
    (type: OrderType) => {
      setOrderType(type);
      setFromPartyId('');
      setToPartyId('');
      setShipToLocationId('');
      setBillToAddress(EMPTY_ADDRESS);
      setShipToAddress(EMPTY_ADDRESS);
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!fromPartyId || !toPartyId) {
      notificationService.warning('Select both parties before saving.');
      return;
    }
    if (!poNumber.trim()) {
      notificationService.warning('Enter a PO number.');
      return;
    }
    if (repSplits.isLoaded && !repSplits.validation.isValid) {
      notificationService.warning('Fix rep split errors before saving.');
      return;
    }
    notificationService.success(`Order ${poNumber} saved (mock).`);
  }, [fromPartyId, toPartyId, poNumber, repSplits.isLoaded, repSplits.validation.isValid]);

  /* ── Config-aware rendering helpers ── */

  const renderOrderType = () => {
    const f = field(hv, 'order_type');
    if (!f) return null;
    return (
      <div className="oe-section" key="order_type" style={{ order: f.sequence }}>
        <p className="oe-section__title">{f.caption}</p>
        <div className="oe-type-grid">
          {ORDER_TYPES.map((opt) => (
            <label
              key={opt.value}
              className={`oe-type-card${orderType === opt.value ? ' oe-type-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="orderType"
                value={opt.value}
                checked={orderType === opt.value}
                onChange={() => handleTypeChange(opt.value)}
              />
              <span className="oe-type-card__label">{opt.label}</span>
              <span className="oe-type-card__desc">{opt.description}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderParties = () => {
    const fromField = field(hv, 'from_party');
    const toField = field(hv, 'to_party');
    if (!fromField && !toField) return null;

    const seq = Math.min(fromField?.sequence ?? 999, toField?.sequence ?? 999);
    return (
      <div className="oe-section" key="parties" style={{ order: seq }}>
        <p className="oe-section__title">Parties</p>
        <Panel>
          <div className="oe-parties">
            {fromField && (
              <div className="oe-party">
                <p className="oe-party__role">{typeOption.fromLabel}</p>
                <SearchableSelect
                  label={fromField.caption}
                  value={fromPartyId}
                  onChange={handleFromChange}
                  options={fromPartyOptions}
                  placeholder="— Choose —"
                />
              </div>
            )}
            {toField && (
              <div className="oe-party">
                <p className="oe-party__role">{typeOption.toLabel}</p>
                <SearchableSelect
                  label={toField.caption}
                  value={toPartyId}
                  onChange={handleToChange}
                  options={toPartyOptions}
                  placeholder="— Choose —"
                />
              </div>
            )}
          </div>
        </Panel>
      </div>
    );
  };

  const renderDetailsSection = () => {
    const poNumField = field(hv, 'po_number');
    const poDateField = field(hv, 'po_date');
    const testField = field(hv, 'test_order');
    if (!poNumField && !poDateField && !testField) return null;

    const seq = Math.min(
      poNumField?.sequence ?? 999,
      poDateField?.sequence ?? 999,
      testField?.sequence ?? 999,
    );

    const detailFields: { id: string; seq: number; render: () => React.ReactNode }[] = [];

    if (poNumField) {
      detailFields.push({
        id: 'po_number',
        seq: poNumField.sequence,
        render: () => (
          <TextField
            key="po_number"
            label={poNumField.caption}
            value={poNumber}
            onChange={setPoNumber}
            placeholder="e.g. PO-2025-042"
          />
        ),
      });
    }

    if (poDateField) {
      detailFields.push({
        id: 'po_date',
        seq: poDateField.sequence,
        render: () => (
          <TextField
            key="po_date"
            label={poDateField.caption}
            type="date"
            value={poDate}
            onChange={setPoDate}
          />
        ),
      });
    }

    if (testField) {
      detailFields.push({
        id: 'test_order',
        seq: testField.sequence,
        render: () => (
          <div className="oe-toggle" key="test_order">
            <label className="oe-toggle__switch">
              <input
                type="checkbox"
                checked={isTestOrder}
                onChange={(e) => setIsTestOrder(e.target.checked)}
              />
              <span className="oe-toggle__track" />
            </label>
            <div>
              <span className="oe-toggle__label">{testField.caption}</span>
              <br />
              <span className="oe-toggle__hint">
                Will not transmit to trading partners
              </span>
            </div>
          </div>
        ),
      });
    }

    detailFields.sort((a, b) => a.seq - b.seq);
    const colClass = detailFields.length === 3 ? 'oe-inline-fields oe-inline-fields--3' :
                     detailFields.length === 2 ? 'oe-inline-fields' :
                     'oe-inline-fields';

    return (
      <div className="oe-section" key="details" style={{ order: seq }}>
        <p className="oe-section__title">Order Details</p>
        <Panel>
          <div className={colClass}>
            {detailFields.map((df) => df.render())}
          </div>
        </Panel>
      </div>
    );
  };

  const renderAddresses = () => {
    const billField = field(hv, 'bill_to');
    const shipField = field(hv, 'ship_to');
    if (!billField && !shipField) return null;

    const seq = Math.min(billField?.sequence ?? 999, shipField?.sequence ?? 999);
    const addresses: { id: string; seq: number; render: () => React.ReactNode }[] = [];

    if (billField) {
      addresses.push({
        id: 'bill_to',
        seq: billField.sequence,
        render: () => (
          <div className="oe-address-card" key="bill_to">
            <div className="oe-address-card__header">
              <h4 className="oe-address-card__title">{billField.caption}</h4>
            </div>
            {billToAddress.name ? (
              <div className="oe-address-block">{formatAddress(billToAddress)}</div>
            ) : (
              <div className="oe-address-block oe-address-block--empty">
                {retailerParty
                  ? 'No billing address on file'
                  : 'Select a retailer to populate'}
              </div>
            )}
          </div>
        ),
      });
    }

    if (shipField) {
      addresses.push({
        id: 'ship_to',
        seq: shipField.sequence,
        render: () => (
          <div className="oe-address-card" key="ship_to">
            <div className="oe-address-card__header">
              <h4 className="oe-address-card__title">{shipField.caption}</h4>
            </div>
            <SearchableSelect
              label="Location"
              value={shipToLocationId}
              onChange={setShipToLocationId}
              options={shipToOptions}
              placeholder={
                shipToLocations.length
                  ? '— Select location —'
                  : '— Select a retailer first —'
              }
              disabled={shipToLocations.length === 0}
            />
            {shipToAddress.name ? (
              <div className="oe-address-block">{formatAddress(shipToAddress)}</div>
            ) : (
              <div className="oe-address-block oe-address-block--empty">
                {shipToLocations.length
                  ? 'Choose a location above'
                  : 'Select a retailer to see locations'}
              </div>
            )}
          </div>
        ),
      });
    }

    addresses.sort((a, b) => a.seq - b.seq);

    return (
      <div className="oe-section" key="addresses" style={{ order: seq }}>
        <p className="oe-section__title">Addresses</p>
        <div className="oe-address-grid">
          {addresses.map((a) => a.render())}
        </div>
      </div>
    );
  };

  /* ── Assemble sections in config sequence ── */

  const sections = [
    renderOrderType(),
    renderParties(),
    renderDetailsSection(),
    renderAddresses(),
  ].filter(Boolean);

  return (
    <div className="oe-page">
      {/* Header */}
      <div className="oe-page__header">
        <div className="oe-page__header-left">
          <button
            className="oe-page__back"
            onClick={() => navigate('/orders')}
            aria-label="Back to Orders"
          >
            &larr;
          </button>
          <div>
            <p className="oe-page__breadcrumb">Orders</p>
            <Headline as="h1">New Order</Headline>
          </div>
        </div>
        <div className="oe-page__actions">
          <Button variant="secondary" size="S" onClick={() => navigate('/orders')}>
            Cancel
          </Button>
          <Button size="S" onClick={handleSave}>
            Save Order
          </Button>
        </div>
      </div>

      <div className="oe-sections-container">
        {sections}
      </div>

      {/* Rep Splits */}
      <RepSplitsSection repSplits={repSplits} />

      {/* Order Items & Transactions */}
      <OrderItemsSection orderItems={orderItems} txnConfig={txn} />

      <Flex style={{ gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <Button variant="secondary" onClick={() => navigate('/orders')}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Order</Button>
      </Flex>
    </div>
  );
};
