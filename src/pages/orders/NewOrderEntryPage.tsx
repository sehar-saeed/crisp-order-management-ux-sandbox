import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Headline, Button, Flex, TextField, SearchableSelect } from '../../ui';
import type { SearchableOption } from '../../ui';
import { notificationService } from '../../services/NotificationService';
import { getPartiesByKind } from '../../mock/orders/mockParties';
import { useRepSplits } from '../../hooks/useRepSplits';
import { useOrderItems } from '../../hooks/useOrderItems';
import { useEntryFieldConfig } from '../../hooks/useEntryFieldConfig';
import { RepSplitsSection } from '../../components/orders/RepSplitsSection';
import { OrderItemsSection } from '../../components/orders/OrderItemsSection';
import { EntryFieldCustomizationDrawer } from '../../components/modals/EntryFieldCustomizationDrawer';
import { DiscountChargeModal } from '../../components/orders/DiscountChargeModal';
import { generateNewOrderHistory } from '../../mock/orders/mockLineItems';
import type { ResolvedEntryField } from '../../types/entryFieldConfig';
import type { OrderHistoryEntry, HistorySource } from '../../mock/orders/mockLineItems';
import type { DiscountChargeEntry } from '../../types/discountCharge';
import type { OrderItem } from '../../types/orderEntry';
import {
  ORDER_TYPES,
  EMPTY_ADDRESS,
  type OrderType,
  type Address,
} from '../../types/orderEntry';
import '../../styles/order-entry.css';
import '../../styles/order-browse.css';
import '../../styles/discount-charge.css';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function field(resolved: ResolvedEntryField[], id: string): ResolvedEntryField | undefined {
  return resolved.find((f) => f.field_id === id);
}

/** IDs of fields that stay in the core top section (outside tabs). */
const CORE_FIELD_IDS = new Set(['order_type', 'from_party', 'to_party', 'po_number', 'po_date', 'test_order']);

type EntryTabId = 'line_items' | 'history';

export const NewOrderEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const { header, txn } = useEntryFieldConfig();
  const hv = header.visible;

  const [orderType, setOrderType] = useState<OrderType>('purchase_order');
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(todayISO);
  const [isTestOrder, setIsTestOrder] = useState(false);
  const [activeTab, setActiveTab] = useState<EntryTabId>('line_items');

  const [fromPartyId, setFromPartyId] = useState('');
  const [toPartyId, setToPartyId] = useState('');

  const [shipToLocationId, setShipToLocationId] = useState('');
  const [billToAddress, setBillToAddress] = useState<Address>(EMPTY_ADDRESS);
  const [shipToAddress, setShipToAddress] = useState<Address>(EMPTY_ADDRESS);
  const [showCustomize, setShowCustomize] = useState(false);

  const [extraFields, setExtraFields] = useState<Record<string, string>>(() => ({
    ship_date: '',
    cancel_date: '',
    invoice_status: 'Open',
    shipment_status: 'Pending',
    comm_status: 'Pending',
    currency: 'USD',
    payment_terms: 'Net 30',
    department: '',
    division: '',
    buyer_ref: '',
    vendor_ref: '',
    special_instructions: '',
    fob: '',
    carrier: '',
    warehouse: '',
  }));

  const updateExtraField = useCallback((id: string, value: string) => {
    setExtraFields((prev) => ({ ...prev, [id]: value }));
  }, []);

  const [headerDC, setHeaderDC] = useState<DiscountChargeEntry[]>([]);
  const [itemDCMap, setItemDCMap] = useState<Record<string, DiscountChargeEntry[]>>({});
  const [dcModal, setDcModal] = useState<
    | { scope: 'header' }
    | { scope: 'item'; item: OrderItem; baseAmount: number }
    | null
  >(null);

  const handleApplyHeaderDC = useCallback((entries: DiscountChargeEntry[]) => {
    setHeaderDC(entries);
    notificationService.success(`Discounts & charges updated (${entries.length} entries)`);
  }, []);

  const handleApplyItemDC = useCallback((itemId: string, entries: DiscountChargeEntry[]) => {
    setItemDCMap((prev) => ({ ...prev, [itemId]: entries }));
    notificationService.success(`Item discounts & charges updated (${entries.length} entries)`);
  }, []);

  const handleOpenItemDC = useCallback((item: OrderItem, baseAmount: number) => {
    setDcModal({ scope: 'item', item, baseAmount });
  }, []);

  const typeOption = useMemo(
    () => ORDER_TYPES.find((t) => t.value === orderType)!,
    [orderType],
  );

  const fromParties = useMemo(
    () => getPartiesByKind(typeOption.fromKind),
    [typeOption.fromKind],
  );
  const toParties = useMemo(
    () => getPartiesByKind(typeOption.toKind),
    [typeOption.toKind],
  );

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

  const retailerId = typeOption.fromKind === 'retailer' ? (fromParty?.id ?? '') :
                     typeOption.toKind === 'retailer' ? (toParty?.id ?? '') : '';
  const supplierId = typeOption.toKind === 'supplier' ? (toParty?.id ?? '') :
                     typeOption.fromKind === 'supplier' ? (fromParty?.id ?? '') : '';

  const repSplits = useRepSplits(
    typeOption.requireRepSplits ? retailerId : '',
    typeOption.requireRepSplits ? supplierId : '',
  );
  const orderItems = useOrderItems();

  const shipToParty = typeOption.fromKind === 'retailer' ? fromParty :
                      typeOption.toKind === 'distributor' ? toParty : fromParty;

  const shipToLocations = useMemo(
    () => shipToParty?.locations ?? [],
    [shipToParty],
  );

  const shipToOptions: SearchableOption[] = useMemo(
    () => shipToLocations.map((l) => ({ id: l.id, label: l.name, secondary: `${l.address.city}, ${l.address.state}` })),
    [shipToLocations],
  );

  const billToParty = fromParty;

  const history = useMemo(() => generateNewOrderHistory(), []);

  useEffect(() => {
    if (typeOption.showBillTo && billToParty) {
      setBillToAddress(billToParty.billToAddress);
    } else {
      setBillToAddress(EMPTY_ADDRESS);
    }
  }, [billToParty, typeOption.showBillTo]);

  useEffect(() => {
    const loc = shipToLocations.find((l) => l.id === shipToLocationId);
    if (loc) {
      setShipToAddress(loc.address);
    } else {
      setShipToAddress(EMPTY_ADDRESS);
    }
  }, [shipToLocationId, shipToLocations]);

  const handleFromChange = useCallback((id: string) => {
    setFromPartyId(id);
    setShipToLocationId('');
  }, []);

  const handleToChange = useCallback((id: string) => {
    setToPartyId(id);
    setShipToLocationId('');
  }, []);

  const handleTypeChange = useCallback((type: OrderType) => {
    setOrderType(type);
    setFromPartyId('');
    setToPartyId('');
    setShipToLocationId('');
    setBillToAddress(EMPTY_ADDRESS);
    setShipToAddress(EMPTY_ADDRESS);
  }, []);

  const handleSave = useCallback(() => {
    const required = typeOption.requiredFields;

    if (required.includes('from_party') && !fromPartyId) {
      notificationService.warning(`Select a ${typeOption.fromLabel}.`);
      return;
    }
    if (required.includes('to_party') && !toPartyId) {
      notificationService.warning(`Select a ${typeOption.toLabel}.`);
      return;
    }
    if (required.includes('po_number') && !poNumber.trim()) {
      notificationService.warning('Enter a PO number.');
      return;
    }
    if (typeOption.requireRepSplits && repSplits.isLoaded && !repSplits.validation.isValid) {
      notificationService.warning('Fix rep split errors before saving.');
      return;
    }
    notificationService.success(`${typeOption.label} ${poNumber} created (mock).`);
  }, [typeOption, fromPartyId, toPartyId, poNumber, repSplits.isLoaded, repSplits.validation.isValid]);

  function isTypeVisible(fieldId: string): boolean {
    return typeOption.visibleFields.includes(fieldId);
  }

  /* ── Order Info: config-driven fields NOT in the core top section ── */

  const detailTabFields = useMemo(() => {
    return hv.filter((f) => !CORE_FIELD_IDS.has(f.field_id));
  }, [hv]);

  /* ── Core top-section render helpers ── */

  const selectableTypes = useMemo(
    () => ORDER_TYPES.filter((t) => !t.disabled),
    [],
  );

  const renderOrderTypeAndParties = () => {
    const typeField = field(hv, 'order_type');
    const fromField = field(hv, 'from_party');
    const toField = field(hv, 'to_party');
    const seq = Math.min(typeField?.sequence ?? 0, fromField?.sequence ?? 1, toField?.sequence ?? 1);

    return (
      <div className="oe-section" key="type_and_parties" style={{ order: seq }}>
        <Panel>
          {/* Segmented control */}
          <div className="oe-type-seg" role="radiogroup" aria-label="Order Type">
            {selectableTypes.map((opt) => (
              <button
                key={opt.value}
                role="radio"
                aria-checked={orderType === opt.value}
                className={`oe-type-seg__btn${orderType === opt.value ? ' oe-type-seg__btn--active' : ''}`}
                onClick={() => handleTypeChange(opt.value)}
              >
                <span className="oe-type-seg__label">{opt.segmentLabel}</span>
                <span className="oe-type-seg__sub">{opt.description}</span>
              </button>
            ))}
          </div>

          {/* Dynamic party selectors — labels change per type */}
          <div className="oe-parties">
            {fromField && (
              <div className="oe-party">
                <p className="oe-party__role">{typeOption.fromLabel}</p>
                <SearchableSelect
                  label={typeOption.fromLabel}
                  value={fromPartyId}
                  onChange={handleFromChange}
                  options={fromPartyOptions}
                  placeholder={`Select ${typeOption.fromLabel.toLowerCase()}\u2026`}
                />
              </div>
            )}
            <div className="oe-party__arrow" aria-hidden="true">\u2192</div>
            {toField && (
              <div className="oe-party">
                <p className="oe-party__role">{typeOption.toLabel}</p>
                <SearchableSelect
                  label={typeOption.toLabel}
                  value={toPartyId}
                  onChange={handleToChange}
                  options={toPartyOptions}
                  placeholder={`Select ${typeOption.toLabel.toLowerCase()}\u2026`}
                />
              </div>
            )}
          </div>
        </Panel>
      </div>
    );
  };

  const renderDetailsSection = () => {
    const poNumField = isTypeVisible('po_number') ? field(hv, 'po_number') : undefined;
    const poDateField = isTypeVisible('po_date') ? field(hv, 'po_date') : undefined;
    const testField = isTypeVisible('test_order') ? field(hv, 'test_order') : undefined;
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

  const coreSections = [
    renderOrderTypeAndParties(),
    renderDetailsSection(),
  ].filter(Boolean);

  /* ── Order Info tab: address + configurable fields ── */

  const COMPUTED_FIELD_IDS = new Set(['total_amount', 'item_count']);
  const WIDE_FIELD_IDS = new Set(['special_instructions', 'bill_to', 'ship_to']);

  const FIELD_GROUPS: { key: string; title: string; fieldIds: string[] }[] = [
    { key: 'addresses', title: 'Addresses', fieldIds: ['bill_to', 'ship_to'] },
    { key: 'dates_status', title: 'Dates & Status', fieldIds: ['ship_date', 'cancel_date', 'invoice_status', 'shipment_status', 'comm_status'] },
    { key: 'financial', title: 'Financial', fieldIds: ['total_amount', 'item_count', 'currency', 'payment_terms'] },
    { key: 'references', title: 'References & Additional', fieldIds: ['department', 'division', 'buyer_ref', 'vendor_ref', 'special_instructions', 'fob', 'carrier', 'warehouse'] },
  ];

  const SELECT_OPTIONS: Record<string, string[]> = {
    invoice_status: ['Open', 'Partial', 'Invoiced', 'Cancelled'],
    shipment_status: ['Pending', 'Partial', 'Shipped', 'Delivered', 'Cancelled'],
    comm_status: ['Pending', 'Calculated', 'Paid', 'Waived'],
    currency: ['USD', 'CAD', 'EUR', 'GBP', 'MXN'],
    payment_terms: ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90', 'Due on Receipt', '2/10 Net 30'],
    carrier: ['UPS Ground', 'UPS Next Day', 'FedEx Ground', 'FedEx Express', 'USPS Priority', 'LTL Freight', 'Customer Pickup'],
  };

  const SEARCHABLE_OPTIONS: Record<string, SearchableOption[]> = useMemo(() => ({
    department: [
      { id: 'grocery', label: 'Grocery' },
      { id: 'dairy', label: 'Dairy' },
      { id: 'frozen', label: 'Frozen' },
      { id: 'produce', label: 'Produce' },
      { id: 'bakery', label: 'Bakery' },
      { id: 'deli', label: 'Deli' },
      { id: 'meat', label: 'Meat & Seafood' },
      { id: 'beverages', label: 'Beverages' },
      { id: 'hba', label: 'Health & Beauty' },
      { id: 'household', label: 'Household' },
      { id: 'general', label: 'General Merchandise' },
    ],
    division: [
      { id: 'east', label: 'East Division' },
      { id: 'west', label: 'West Division' },
      { id: 'central', label: 'Central Division' },
      { id: 'south', label: 'South Division' },
      { id: 'northeast', label: 'Northeast Division' },
    ],
  }), []);

  const TEXTAREA_FIELD_IDS = new Set(['special_instructions']);

  function renderFieldControl(f: ResolvedEntryField): React.ReactNode {
    if (f.field_id === 'bill_to') {
      return billToAddress.name
        ? <span className="oi-field-val">{formatAddress(billToAddress)}</span>
        : <span className="oi-field-val oi-field-val--placeholder">
            {billToParty ? 'No billing address on file' : `Select a ${typeOption.fromLabel.toLowerCase()} to populate`}
          </span>;
    }
    if (f.field_id === 'ship_to') {
      return shipToAddress.name
        ? <span className="oi-field-val">{formatAddress(shipToAddress)}</span>
        : <span className="oi-field-val oi-field-val--placeholder">
            {shipToLocations.length
              ? 'Choose a location in the order form'
              : `Select a ${(typeOption.fromKind === 'retailer' ? 'retailer' : 'party')} first`}
          </span>;
    }
    if (f.field_id === 'total_amount') {
      return <span className="oi-field-val oi-field-val--computed">
        {orderItems.hasItems ? formatCurrency(orderItems.orderTotal) : '$0.00'}
      </span>;
    }
    if (f.field_id === 'item_count') {
      return <span className="oi-field-val oi-field-val--computed">
        {orderItems.hasItems ? `${orderItems.items.length}` : '0'}
      </span>;
    }

    const val = extraFields[f.field_id] ?? '';

    if (f.field_type === 'date') {
      return <input className="oi-field-input" type="date" value={val}
        onChange={(e) => updateExtraField(f.field_id, e.target.value)} />;
    }

    if (SELECT_OPTIONS[f.field_id]) {
      return (
        <select className="oi-field-select" value={val}
          onChange={(e) => updateExtraField(f.field_id, e.target.value)}>
          <option value="">— Select —</option>
          {SELECT_OPTIONS[f.field_id].map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (SEARCHABLE_OPTIONS[f.field_id]) {
      return (
        <SearchableSelect
          value={val}
          onChange={(id) => updateExtraField(f.field_id, id)}
          options={SEARCHABLE_OPTIONS[f.field_id]}
          placeholder={`Search ${f.caption.toLowerCase()}…`}
          emptyMessage={`No matching ${f.caption.toLowerCase()}`}
        />
      );
    }

    if (TEXTAREA_FIELD_IDS.has(f.field_id)) {
      return (
        <textarea className="oi-field-textarea" rows={3} value={val}
          placeholder={`Enter ${f.caption.toLowerCase()}`}
          onChange={(e) => updateExtraField(f.field_id, e.target.value)} />
      );
    }

    return <input className="oi-field-input" type="text" value={val}
      placeholder={`Enter ${f.caption.toLowerCase()}`}
      onChange={(e) => updateExtraField(f.field_id, e.target.value)} />;
  }

  const orderInfoSections = useMemo(() => {
    const billVisible = typeOption.showBillTo && !!field(hv, 'bill_to');
    const shipVisible = typeOption.showShipTo && !!field(hv, 'ship_to');

    const visibleSet = new Set(
      detailTabFields
        .filter((f) => {
          if (f.field_id === 'bill_to') return billVisible;
          if (f.field_id === 'ship_to') return shipVisible;
          return true;
        })
        .map((f) => f.field_id),
    );

    const fieldMap = new Map(detailTabFields.map((f) => [f.field_id, f]));

    const populated = FIELD_GROUPS
      .map((g) => ({
        ...g,
        fields: g.fieldIds
          .filter((id) => visibleSet.has(id))
          .map((id) => fieldMap.get(id)!)
          .filter(Boolean),
      }))
      .filter((g) => g.fields.length > 0);

    const ungrouped = detailTabFields
      .filter((f) => visibleSet.has(f.field_id) && !FIELD_GROUPS.some((g) => g.fieldIds.includes(f.field_id)))
      .sort((a, b) => a.sequence - b.sequence);

    if (ungrouped.length > 0) {
      populated.push({ key: 'other', title: 'Other', fieldIds: ungrouped.map((f) => f.field_id), fields: ungrouped });
    }

    return populated;
  }, [hv, detailTabFields, typeOption, billToParty, shipToLocations]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="oe-page">
      {/* ── Page header ── */}
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
            <Headline as="h1">Order Edit</Headline>
          </div>
        </div>
        <div className="oe-page__actions">
          <DCActionButton
            entries={headerDC}
            onClick={() => setDcModal({ scope: 'header' })}
          />
          <Button variant="secondary" size="S" onClick={() => navigate('/orders')}>
            Cancel
          </Button>
          <Button size="S" onClick={handleSave}>
            Save Order
          </Button>
        </div>
      </div>

      {/* ── Core fields (always visible at top) ── */}
      <div className="oe-sections-container">
        {coreSections}
      </div>

      {/* ── Order Info sections (inline, between core fields and line items) ── */}
      {orderInfoSections.length > 0 && (
        <div className="oe-info-sections">
          {orderInfoSections.map((g) => (
            <section key={g.key} className="oe-info-section">
              <h3 className="oe-info-section__title">{g.title}</h3>
              <div className="oe-info-section__grid">
                {g.fields.map((f) => {
                  const cls = [
                    'oe-info-field',
                    COMPUTED_FIELD_IDS.has(f.field_id) && 'oe-info-field--readonly',
                    WIDE_FIELD_IDS.has(f.field_id) && 'oe-info-field--wide',
                  ].filter(Boolean).join(' ');
                  return (
                    <div key={f.field_id} className={cls}>
                      <label className="oe-info-field__label">
                        {f.caption}
                        {COMPUTED_FIELD_IDS.has(f.field_id) && (
                          <span className="oe-info-field__auto">auto</span>
                        )}
                        {f.has_override && (
                          <span className="oe-info-field__dot" title="Customized" />
                        )}
                      </label>
                      {renderFieldControl(f)}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── Tabs: Line Items + History ── */}
      <div className="od-tabs" style={{ marginTop: '1.25rem' }}>
        <button
          className={`od-tabs__tab${activeTab === 'line_items' ? ' od-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('line_items')}
        >
          Line Items
        </button>
        <button
          className={`od-tabs__tab${activeTab === 'history' ? ' od-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History / Modifications ({history.length})
        </button>
        <button
          className="od-tabs__customize"
          onClick={() => setShowCustomize(true)}
          title="Customize which fields are visible, their order, and captions"
        >
          &#x2699; Customize Fields
        </button>
      </div>

      {/* ── Tab: Line Items ── */}
      {activeTab === 'line_items' && (
        <div className="oe-tab-content">
          <OrderItemsSection
            orderItems={orderItems}
            txnConfig={txn}
            itemDCMap={itemDCMap}
            onOpenItemDC={handleOpenItemDC}
          />
          {typeOption.requireRepSplits && (
            <RepSplitsSection repSplits={repSplits} showGetDefaults />
          )}
          <Flex style={{ gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={() => navigate('/orders')}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Order</Button>
          </Flex>
        </div>
      )}

      {/* ── Tab: History / Modifications ── */}
      {activeTab === 'history' && (
        <div className="od-tab-panel">
          <HistoryTab entries={history} />
        </div>
      )}

      {showCustomize && (
        <EntryFieldCustomizationDrawer
          header={header}
          txn={txn}
          onClose={() => setShowCustomize(false)}
        />
      )}

      {/* ── Discount / Charge Modals ── */}
      {dcModal?.scope === 'header' && (
        <DiscountChargeModal
          scope="header"
          targetLabel={poNumber ? `Order ${poNumber}` : 'New Order'}
          baseAmount={orderItems.orderTotal}
          initialEntries={headerDC}
          onApply={handleApplyHeaderDC}
          onClose={() => setDcModal(null)}
        />
      )}
      {dcModal?.scope === 'item' && (
        <DiscountChargeModal
          scope="item"
          targetLabel={`Line #${dcModal.item.line_number} — ${dcModal.item.description}`}
          baseAmount={dcModal.baseAmount}
          initialEntries={itemDCMap[dcModal.item.id] ?? []}
          onApply={(entries) => handleApplyItemDC(dcModal.item.id, entries)}
          onClose={() => setDcModal(null)}
        />
      )}
    </div>
  );
};

/* ── Discounts & Charges action button ── */

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

/* ── History / Modifications tab ── */

const SOURCE_META: Record<HistorySource, { label: string; cssClass: string }> = {
  manual: { label: 'Manual', cssClass: 'od-src--manual' },
  edi:    { label: 'EDI', cssClass: 'od-src--edi' },
  upload: { label: 'Upload', cssClass: 'od-src--upload' },
  system: { label: 'System', cssClass: 'od-src--system' },
};

function HistoryTab({ entries }: { entries: OrderHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="od-hv__empty">
        No history yet. Changes will appear here once the order is saved.
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
