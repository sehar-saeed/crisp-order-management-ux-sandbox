import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headline, Panel, Button, TextField, Flex } from '../../ui';
import { useEntryFieldConfig, resolveEntryFields } from '../../hooks/useEntryFieldConfig';
import { notificationService } from '../../services/NotificationService';
import type {
  MasterEntryField,
  ClientEntryOverride,
  ResolvedEntryField,
} from '../../types/entryFieldConfig';
import '../../styles/entry-customize.css';

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  date: 'Date',
  toggle: 'Toggle',
  select: 'Select',
  address: 'Address',
  party_select: 'Party',
  order_type: 'Type',
  number: 'Number',
  currency: 'Currency',
};

/* ── Override helpers ── */

function upsertOverride(
  overrides: ClientEntryOverride[],
  fieldId: string,
  updates: Partial<Omit<ClientEntryOverride, 'field_id'>>,
): ClientEntryOverride[] {
  const idx = overrides.findIndex((o) => o.field_id === fieldId);
  if (idx >= 0) {
    const merged = { ...overrides[idx], ...updates };
    return overrides.map((o, i) => (i === idx ? merged : o));
  }
  return [...overrides, { field_id: fieldId, ...updates }];
}

function removeOverride(
  overrides: ClientEntryOverride[],
  fieldId: string,
): ClientEntryOverride[] {
  return overrides.filter((o) => o.field_id !== fieldId);
}

/* ── Tab type ── */

type TabId = 'header' | 'txn';

const TAB_LABELS: Record<TabId, string> = {
  header: 'Order Info Fields',
  txn: 'Item Entry Fields',
};

export const EntryFieldCustomizationPage: React.FC = () => {
  const navigate = useNavigate();
  const { header, txn } = useEntryFieldConfig();

  const [activeTab, setActiveTab] = useState<TabId>('header');

  const [headerDraft, setHeaderDraft] = useState<ClientEntryOverride[]>(
    () => header.overrides.map((o) => ({ ...o })),
  );
  const [txnDraft, setTxnDraft] = useState<ClientEntryOverride[]>(
    () => txn.overrides.map((o) => ({ ...o })),
  );

  const activeMasters = activeTab === 'header' ? header.masters : txn.masters;
  const draft = activeTab === 'header' ? headerDraft : txnDraft;
  const setDraft = activeTab === 'header' ? setHeaderDraft : setTxnDraft;

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    () => activeMasters[0]?.field_id ?? null,
  );
  const [searchQuery, setSearchQuery] = useState('');

  const masterMap = useMemo(
    () => new Map(activeMasters.map((m) => [m.field_id, m])),
    [activeMasters],
  );

  const draftResolved = useMemo(
    () => resolveEntryFields(activeMasters, draft),
    [activeMasters, draft],
  );

  const filteredResolved = useMemo(() => {
    if (!searchQuery.trim()) return draftResolved;
    const q = searchQuery.trim().toLowerCase();
    return draftResolved.filter(
      (c) =>
        c.caption.toLowerCase().includes(q) ||
        c.field_id.toLowerCase().includes(q) ||
        c.field_type.toLowerCase().includes(q),
    );
  }, [draftResolved, searchQuery]);

  const customizedCount = draftResolved.filter((c) => c.has_override).length;
  const visibleCount = draftResolved.filter((c) => c.visible).length;

  const allHeaderResolved = useMemo(
    () => resolveEntryFields(header.masters, headerDraft),
    [header.masters, headerDraft],
  );
  const allTxnResolved = useMemo(
    () => resolveEntryFields(txn.masters, txnDraft),
    [txn.masters, txnDraft],
  );
  const totalCustomized =
    allHeaderResolved.filter((c) => c.has_override).length +
    allTxnResolved.filter((c) => c.has_override).length;

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(headerDraft) !== JSON.stringify(header.overrides) ||
      JSON.stringify(txnDraft) !== JSON.stringify(txn.overrides)
    );
  }, [headerDraft, txnDraft, header.overrides, txn.overrides]);

  const selectedResolved = selectedFieldId
    ? draftResolved.find((c) => c.field_id === selectedFieldId) ?? null
    : null;
  const selectedMaster = selectedFieldId
    ? masterMap.get(selectedFieldId) ?? null
    : null;

  const updateField = useCallback(
    (fieldId: string, updates: Partial<Omit<ClientEntryOverride, 'field_id'>>) => {
      setDraft((prev) => upsertOverride(prev, fieldId, updates));
    },
    [setDraft],
  );

  const toggleVisible = useCallback(
    (fieldId: string) => {
      const resolved = draftResolved.find((c) => c.field_id === fieldId);
      if (!resolved || !resolved.allow_hide) return;
      setDraft((prev) => upsertOverride(prev, fieldId, { visible: !resolved.visible }));
    },
    [draftResolved, setDraft],
  );

  const resetField = useCallback(
    (fieldId: string) => {
      setDraft((prev) => removeOverride(prev, fieldId));
    },
    [setDraft],
  );

  const moveItem = useCallback(
    (from: number, to: number) => {
      if (from === to || to < 0 || to >= draftResolved.length) return;
      const list = [...draftResolved];
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      setDraft((prev) => {
        let updated = [...prev];
        list.forEach((col, idx) => {
          const m = masterMap.get(col.field_id);
          if (!m || idx === m.default_sequence) {
            const existing = updated.find((o) => o.field_id === col.field_id);
            if (existing?.sequence !== undefined) {
              const { sequence: _, ...rest } = existing;
              const hasOtherProps = Object.keys(rest).some((k) => k !== 'field_id');
              if (hasOtherProps) {
                updated = updated.map((o) =>
                  o.field_id === col.field_id ? (rest as ClientEntryOverride) : o,
                );
              } else {
                updated = removeOverride(updated, col.field_id);
              }
            }
          } else {
            updated = upsertOverride(updated, col.field_id, { sequence: idx });
          }
        });
        return updated;
      });
    },
    [draftResolved, masterMap, setDraft],
  );

  const handleSave = () => {
    header.applyOverrides(headerDraft);
    txn.applyOverrides(txnDraft);
    notificationService.success('Entry field configuration saved');
  };

  const handleResetAll = () => {
    header.resetAll();
    txn.resetAll();
    setHeaderDraft([]);
    setTxnDraft([]);
    setSelectedFieldId(header.masters[0]?.field_id ?? null);
    notificationService.success('All customizations reset to defaults');
  };

  const handleBack = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard and leave?')) return;
    navigate('/orders/new');
  };

  const handleSwitchTab = (tab: TabId) => {
    setActiveTab(tab);
    setSearchQuery('');
    const masters = tab === 'header' ? header.masters : txn.masters;
    setSelectedFieldId(masters[0]?.field_id ?? null);
  };

  return (
    <div className="ec-page">
      <div className="ec-page__header">
        <div className="ec-page__header-top">
          <div>
            <Button size="S" variant="text" onClick={handleBack}>
              &larr; Back to Order Edit
            </Button>
            <Headline as="h1">Customize Fields</Headline>
            <p className="ec-page__desc">
              Configure which fields appear on the Order Entry form and Item Transaction table —
              their display order, captions, and visibility.
            </p>
          </div>
          <div className="ec-page__header-stats">
            <span className="ec-page__stat">
              <strong>{visibleCount}</strong> of {draftResolved.length} visible
            </span>
            {totalCustomized > 0 && (
              <span className="ec-page__stat ec-page__stat--override">
                {totalCustomized} customized
              </span>
            )}
            {isDirty && (
              <span className="ec-page__stat ec-page__stat--dirty">Unsaved changes</span>
            )}
          </div>
        </div>
        <div className="ec-page__header-actions">
          <Button variant="secondary" onClick={handleResetAll}>Reset All to Defaults</Button>
          <Flex style={{ gap: '0.5rem' }}>
            <Button variant="secondary" onClick={handleBack}>Cancel</Button>
            <Button onClick={handleSave} disabled={!isDirty}>Save Changes</Button>
          </Flex>
        </div>
      </div>

      {/* Scope tabs */}
      <div className="ec-page__tabs">
        {(['header', 'txn'] as TabId[]).map((tab) => (
          <button
            key={tab}
            className={`ec-page__tab${activeTab === tab ? ' ec-page__tab--active' : ''}`}
            onClick={() => handleSwitchTab(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="ec-page__body">
        {/* ── Left Panel: Field List ── */}
        <Panel className="ec-page__left">
          <div className="ec-page__search">
            <TextField
              label=""
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search fields..."
            />
          </div>
          <div className="ec-page__field-list">
            {filteredResolved.map((col) => {
              const globalIdx = draftResolved.findIndex((c) => c.field_id === col.field_id);
              const isSelected = col.field_id === selectedFieldId;
              return (
                <div
                  key={col.field_id}
                  className={[
                    'ec-page__field-item',
                    isSelected && 'ec-page__field-item--selected',
                    !col.visible && 'ec-page__field-item--hidden',
                    !col.allow_hide && 'ec-page__field-item--locked',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedFieldId(col.field_id)}
                >
                  <div className="ec-page__field-item-left">
                    {col.allow_hide ? (
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleVisible(col.field_id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="ec-page__lock" title="Required — cannot be hidden">&#x1F512;</span>
                    )}
                    <div className="ec-page__field-item-info">
                      <span className="ec-page__field-item-caption">{col.caption}</span>
                      <span className="ec-page__field-item-meta">
                        {FIELD_TYPE_LABELS[col.field_type] ?? col.field_type}
                        {' \u00b7 '}
                        {col.field_id}
                      </span>
                    </div>
                    {col.has_override && (
                      <span className="ec-page__override-dot" title="Customized" />
                    )}
                  </div>
                  <div className="ec-page__field-item-right">
                    <button
                      className="ec-page__arrow-btn"
                      onClick={(e) => { e.stopPropagation(); moveItem(globalIdx, globalIdx - 1); }}
                      disabled={globalIdx === 0}
                      aria-label="Move up"
                    >
                      &#x25B2;
                    </button>
                    <button
                      className="ec-page__arrow-btn"
                      onClick={(e) => { e.stopPropagation(); moveItem(globalIdx, globalIdx + 1); }}
                      disabled={globalIdx === draftResolved.length - 1}
                      aria-label="Move down"
                    >
                      &#x25BC;
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredResolved.length === 0 && searchQuery && (
              <div className="ec-page__no-results">
                No fields matching &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        </Panel>

        {/* ── Right Panel: Field Editor ── */}
        <Panel className="ec-page__right">
          {selectedResolved && selectedMaster ? (
            <FieldEditor
              resolved={selectedResolved}
              master={selectedMaster}
              onUpdate={(updates) => updateField(selectedResolved.field_id, updates)}
              onReset={() => resetField(selectedResolved.field_id)}
              onToggleVisible={() => toggleVisible(selectedResolved.field_id)}
            />
          ) : (
            <div className="ec-page__empty-editor">
              <p>Select a field from the list to edit its properties.</p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};

/* ── Field Editor (right panel) ── */

interface FieldEditorProps {
  resolved: ResolvedEntryField;
  master: MasterEntryField;
  onUpdate: (updates: Partial<Omit<ClientEntryOverride, 'field_id'>>) => void;
  onReset: () => void;
  onToggleVisible: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  resolved,
  master,
  onUpdate,
  onReset,
  onToggleVisible,
}) => {
  const captionDiffers = resolved.caption !== master.caption;
  const visibleDiffers = resolved.visible !== master.default_visible;

  return (
    <div className="ec-editor">
      <div className="ec-editor__header">
        <h2 className="ec-editor__title">
          {resolved.caption}
          {resolved.has_override && (
            <span className="ec-page__override-dot ec-page__override-dot--inline" title="Customized" />
          )}
        </h2>
        <div className="ec-editor__source">
          <code>{FIELD_TYPE_LABELS[master.field_type] ?? master.field_type}</code>
          {' \u00b7 '}
          <code>{master.scope === 'header' ? 'Order Info' : 'Item Transaction'}</code>
          {' \u00b7 '}
          <code>{master.field_id}</code>
        </div>
      </div>

      <div className="ec-editor__grid">
        <div className="ec-editor__section">
          <h3 className="ec-editor__section-title">Display</h3>

          <div className={captionDiffers ? 'ec-editor__field--overridden' : ''}>
            <TextField
              label="Caption"
              value={resolved.caption}
              onChange={(v) => onUpdate({ caption: v || master.caption })}
              placeholder={master.caption}
            />
            {captionDiffers && (
              <span className="ec-editor__field-default">Default: {master.caption}</span>
            )}
          </div>

          {resolved.allow_hide ? (
            <div className={visibleDiffers ? 'ec-editor__field--overridden' : ''}>
              <label className="ec-editor__checkbox-label">
                <input
                  type="checkbox"
                  checked={resolved.visible}
                  onChange={onToggleVisible}
                />
                Visible on form
              </label>
              {visibleDiffers && (
                <span className="ec-editor__field-default">
                  Default: {master.default_visible ? 'Visible' : 'Hidden'}
                </span>
              )}
            </div>
          ) : (
            <div className="ec-editor__locked-note">
              <span className="ec-page__lock">&#x1F512;</span>
              This field is required and cannot be hidden.
            </div>
          )}
        </div>

        <div className="ec-editor__section">
          <h3 className="ec-editor__section-title">Field Info</h3>
          <div className="ec-editor__info-grid">
            <div className="ec-editor__info-item">
              <span className="ec-editor__info-label">Field ID</span>
              <code className="ec-editor__info-value">{master.field_id}</code>
            </div>
            <div className="ec-editor__info-item">
              <span className="ec-editor__info-label">Type</span>
              <code className="ec-editor__info-value">{FIELD_TYPE_LABELS[master.field_type] ?? master.field_type}</code>
            </div>
            <div className="ec-editor__info-item">
              <span className="ec-editor__info-label">Scope</span>
              <code className="ec-editor__info-value">{master.scope === 'header' ? 'Order Info' : 'Item Transaction'}</code>
            </div>
            <div className="ec-editor__info-item">
              <span className="ec-editor__info-label">Hideable</span>
              <code className="ec-editor__info-value">{master.allow_hide ? 'Yes' : 'No (required)'}</code>
            </div>
          </div>
        </div>
      </div>

      {resolved.has_override && (
        <div className="ec-editor__reset">
          <Button variant="secondary" onClick={onReset}>
            Reset this field to defaults
          </Button>
        </div>
      )}
    </div>
  );
};
