import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer, Button, TextField, Flex } from '../../ui';
import type {
  MasterEntryField,
  ClientEntryOverride,
  ResolvedEntryField,
} from '../../types/entryFieldConfig';
import { resolveEntryFields } from '../../hooks/useEntryFieldConfig';
import type { EntryFieldSet } from '../../hooks/useEntryFieldConfig';

/* ── Field-type labels for display ── */

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

/* ── Override helpers (mirrors the browse field helpers pattern) ── */

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

interface TabConfig {
  id: TabId;
  label: string;
  fieldSet: EntryFieldSet;
}

/* ── Component ── */

interface EntryFieldCustomizationDrawerProps {
  header: EntryFieldSet;
  txn: EntryFieldSet;
  onClose: () => void;
}

export const EntryFieldCustomizationDrawer: React.FC<EntryFieldCustomizationDrawerProps> = ({
  header,
  txn,
  onClose,
}) => {
  const navigate = useNavigate();

  const tabs: TabConfig[] = useMemo(
    () => [
      { id: 'header', label: 'Order Info Fields', fieldSet: header },
      { id: 'txn', label: 'Item Entry Fields', fieldSet: txn },
    ],
    [header, txn],
  );

  const [activeTab, setActiveTab] = useState<TabId>('header');
  const activeConfig = tabs.find((t) => t.id === activeTab)!;

  const [headerDraft, setHeaderDraft] = useState<ClientEntryOverride[]>(
    () => header.overrides.map((o) => ({ ...o })),
  );
  const [txnDraft, setTxnDraft] = useState<ClientEntryOverride[]>(
    () => txn.overrides.map((o) => ({ ...o })),
  );

  const draft = activeTab === 'header' ? headerDraft : txnDraft;
  const setDraft = activeTab === 'header' ? setHeaderDraft : setTxnDraft;

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const masterMap = useMemo(
    () => new Map(activeConfig.fieldSet.masters.map((m) => [m.field_id, m])),
    [activeConfig.fieldSet.masters],
  );

  const draftResolved = useMemo(
    () => resolveEntryFields(activeConfig.fieldSet.masters, draft),
    [activeConfig.fieldSet.masters, draft],
  );

  const customizedCount = draftResolved.filter((c) => c.has_override).length;

  const updateField = (fieldId: string, updates: Partial<Omit<ClientEntryOverride, 'field_id'>>) => {
    setDraft((prev) => upsertOverride(prev, fieldId, updates));
  };

  const toggleVisible = (fieldId: string) => {
    const resolved = draftResolved.find((c) => c.field_id === fieldId);
    if (!resolved || !resolved.allow_hide) return;
    updateField(fieldId, { visible: !resolved.visible });
  };

  const resetField = (fieldId: string) => {
    setDraft((prev) => removeOverride(prev, fieldId));
    if (editingFieldId === fieldId) setEditingFieldId(null);
  };

  const moveItem = useCallback(
    (from: number, to: number) => {
      if (from === to || to < 0 || to >= draftResolved.length) return;
      const list = [...draftResolved];
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      setDraft((prev) => {
        let updated = [...prev];
        list.forEach((col, idx) => {
          const master = masterMap.get(col.field_id);
          if (!master || idx === master.default_sequence) {
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

  /* ── Drag & drop ── */

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    (e.currentTarget as HTMLElement).style.opacity = '0.4';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== toIndex) {
        moveItem(dragIndex, toIndex);
      }
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [dragIndex, moveItem],
  );

  /* ── Actions ── */

  const handleApply = () => {
    header.applyOverrides(headerDraft);
    txn.applyOverrides(txnDraft);
    onClose();
  };

  const handleResetAllSection = () => {
    setDraft([]);
  };

  const handleResetAll = () => {
    setHeaderDraft([]);
    setTxnDraft([]);
  };

  const handleOpenFullPage = () => {
    onClose();
    navigate('/orders/customize-entry-fields');
  };

  const handleSwitchTab = (tab: TabId) => {
    setActiveTab(tab);
    setEditingFieldId(null);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (editingFieldId) setEditingFieldId(null);
      else onClose();
    }
  };

  const editingResolved = editingFieldId
    ? draftResolved.find((c) => c.field_id === editingFieldId)
    : null;
  const editingMaster = editingFieldId ? masterMap.get(editingFieldId) : null;

  const totalCustomized =
    resolveEntryFields(header.masters, headerDraft).filter((c) => c.has_override).length +
    resolveEntryFields(txn.masters, txnDraft).filter((c) => c.has_override).length;

  return (
    <Drawer title="Customize Fields" onCloseClick={onClose}>
      <div className="ef-drawer" onKeyDown={handleKeyDown}>
        <div className="ef-drawer__top-actions">
          <Button size="S" variant="text" onClick={handleOpenFullPage}>
            Open Full Configuration &rarr;
          </Button>
        </div>
        {/* Tabs */}
        <div className="ef-drawer__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`ef-drawer__tab${activeTab === tab.id ? ' ef-drawer__tab--active' : ''}`}
              onClick={() => handleSwitchTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!editingResolved ? (
          <>
            <p className="ef-drawer__hint">
              Toggle visibility, drag to reorder, or click Edit to override captions.
              {customizedCount > 0 && (
                <span className="ef-drawer__override-count">
                  {' '}{customizedCount} field{customizedCount !== 1 ? 's' : ''} customized
                </span>
              )}
            </p>

            <div className="ef-drawer__list" ref={listRef}>
              {draftResolved.map((col, idx) => (
                <div
                  key={col.field_id}
                  className={[
                    'ef-drawer__item',
                    !col.visible && 'ef-drawer__item--hidden',
                    !col.allow_hide && 'ef-drawer__item--locked',
                    dragOverIndex === idx && dragIndex !== idx && 'ef-drawer__item--drag-over',
                  ].filter(Boolean).join(' ')}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                >
                  <div className="ef-drawer__item-left">
                    <span className="ef-drawer__drag-handle" title="Drag to reorder">&#x2807;</span>
                    {col.allow_hide ? (
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleVisible(col.field_id)}
                        title="Toggle visibility"
                      />
                    ) : (
                      <span className="ef-drawer__lock" title="Required — cannot be hidden">&#x1F512;</span>
                    )}
                    <span className="ef-drawer__item-caption">{col.caption}</span>
                    <span className="ef-drawer__item-type">
                      {FIELD_TYPE_LABELS[col.field_type] ?? col.field_type}
                    </span>
                    {col.has_override && (
                      <span className="ef-drawer__override-dot" title="Customized" />
                    )}
                  </div>
                  <div className="ef-drawer__item-actions">
                    {col.has_override && (
                      <button
                        className="ef-drawer__reset-btn"
                        onClick={() => resetField(col.field_id)}
                        title="Reset to default"
                      >
                        &#x21BA;
                      </button>
                    )}
                    <button
                      className="ef-drawer__arrow-btn"
                      onClick={() => moveItem(idx, idx - 1)}
                      disabled={idx === 0}
                      aria-label="Move up"
                    >
                      &#x25B2;
                    </button>
                    <button
                      className="ef-drawer__arrow-btn"
                      onClick={() => moveItem(idx, idx + 1)}
                      disabled={idx === draftResolved.length - 1}
                      aria-label="Move down"
                    >
                      &#x25BC;
                    </button>
                    <Button size="S" variant="text" onClick={() => setEditingFieldId(col.field_id)}>
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="ef-drawer__section-actions">
              <Button size="S" variant="text" onClick={handleResetAllSection}>
                Reset {activeTab === 'header' ? 'Order Info' : 'Item Entry'} Fields
              </Button>
              {totalCustomized > 0 && (
                <Button size="S" variant="text" onClick={handleResetAll} style={{ color: '#b91c1c' }}>
                  Reset All Fields
                </Button>
              )}
            </div>

            <div className="ef-drawer__footer">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={handleApply}>Apply Changes</Button>
            </div>
          </>
        ) : (
          <EditEntryFieldView
            resolved={editingResolved}
            master={editingMaster!}
            onUpdate={(updates) => updateField(editingResolved.field_id, updates)}
            onReset={() => resetField(editingResolved.field_id)}
            onBack={() => setEditingFieldId(null)}
          />
        )}
      </div>
    </Drawer>
  );
};

/* ── Edit View ── */

interface EditEntryFieldViewProps {
  resolved: ResolvedEntryField;
  master: MasterEntryField;
  onUpdate: (updates: Partial<Omit<ClientEntryOverride, 'field_id'>>) => void;
  onReset: () => void;
  onBack: () => void;
}

const EditEntryFieldView: React.FC<EditEntryFieldViewProps> = ({
  resolved,
  master,
  onUpdate,
  onReset,
  onBack,
}) => {
  const captionDiffers = resolved.caption !== master.caption;

  return (
    <div className="ef-drawer__edit">
      <Button size="S" variant="text" onClick={onBack} style={{ marginBottom: '0.75rem' }}>
        &larr; Back to list
      </Button>
      <h3 className="ef-drawer__edit-title">
        Edit: {resolved.caption}
        {resolved.has_override && (
          <span className="ef-drawer__override-dot ef-drawer__override-dot--inline" title="Customized" />
        )}
      </h3>

      <div className="ef-drawer__edit-fields">
        <div className={captionDiffers ? 'ef-drawer__field--overridden' : ''}>
          <TextField
            label="Caption"
            value={resolved.caption}
            onChange={(v) => onUpdate({ caption: v || master.caption })}
            placeholder={master.caption}
          />
          {captionDiffers && (
            <span className="ef-drawer__field-default">
              Default: {master.caption}
            </span>
          )}
        </div>

        <div className="ef-drawer__edit-meta">
          <span>Field type: <code>{FIELD_TYPE_LABELS[master.field_type] ?? master.field_type}</code></span>
          <span>Scope: <code>{master.scope === 'header' ? 'Order' : 'Item Transaction'}</code></span>
          <span>
            Visibility: {resolved.allow_hide
              ? (resolved.visible ? 'Visible' : 'Hidden')
              : 'Always visible (required)'}
          </span>
        </div>
      </div>

      {resolved.has_override && (
        <div className="ef-drawer__edit-reset">
          <Button variant="secondary" onClick={onReset}>
            Reset to Default
          </Button>
        </div>
      )}
    </div>
  );
};
