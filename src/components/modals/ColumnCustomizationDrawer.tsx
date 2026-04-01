import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Drawer, Button, TextField, SelectField, Flex } from '../../ui';
import type {
  MasterBrowseField,
  ClientBrowseOverride,
  ResolvedBrowseColumn,
  NumberFormat,
  DataType,
} from '../../types/browseConfig';
import { resolveColumns } from '../../hooks/useBrowseConfig';
import { formatCellValue } from '../table/ConfigDrivenGrid';

/**
 * Props for the Customize Columns drawer.
 * masterFields = master_custom_browse rows (read-only).
 * clientOverrides = custom_browse rows (the client's current overrides).
 */
interface ColumnCustomizationDrawerProps {
  masterFields: readonly MasterBrowseField[];
  clientOverrides: ClientBrowseOverride[];
  onApply: (overrides: ClientBrowseOverride[]) => void;
  onResetAll: () => void;
  onClose: () => void;
}

const NUMBER_FORMATS: NumberFormat[] = ['number', 'dollars', 'percent'];

const DATA_TYPE_LABELS: Record<DataType, string> = {
  string: 'String',
  number: 'Number',
  date: 'Date',
};

const NUMBER_FORMAT_LABELS: Record<string, string> = {
  number: 'Plain Number',
  dollars: 'Dollars ($)',
  percent: 'Percent (%)',
};

const SAMPLE_VALUES: Record<DataType, any> = {
  number: 12345.6789,
  date: '2025-03-15',
  string: 'Sample Text',
};

function upsertOverride(
  overrides: ClientBrowseOverride[],
  fieldId: string,
  updates: Partial<Omit<ClientBrowseOverride, 'field_id'>>,
): ClientBrowseOverride[] {
  const idx = overrides.findIndex((o) => o.field_id === fieldId);
  if (idx >= 0) {
    const updated = [...overrides];
    updated[idx] = { ...updated[idx], ...updates };
    return updated;
  }
  return [...overrides, { field_id: fieldId, ...updates }];
}

function removeOverride(
  overrides: ClientBrowseOverride[],
  fieldId: string,
): ClientBrowseOverride[] {
  return overrides.filter((o) => o.field_id !== fieldId);
}

export const ColumnCustomizationDrawer: React.FC<ColumnCustomizationDrawerProps> = ({
  masterFields,
  clientOverrides,
  onApply,
  onResetAll,
  onClose,
}) => {
  const [draft, setDraft] = useState<ClientBrowseOverride[]>(
    () => clientOverrides.map((o) => ({ ...o })),
  );
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const masterMap = useMemo(
    () => new Map(masterFields.map((m) => [m.field_id, m])),
    [masterFields],
  );

  const draftResolved = useMemo(
    () => resolveColumns([...masterFields], draft),
    [masterFields, draft],
  );

  const customizedCount = draftResolved.filter((c) => c.has_override).length;

  const updateField = (fieldId: string, updates: Partial<Omit<ClientBrowseOverride, 'field_id'>>) => {
    setDraft((prev) => upsertOverride(prev, fieldId, updates));
  };

  const toggleVisible = (fieldId: string) => {
    const resolved = draftResolved.find((c) => c.field_id === fieldId);
    if (!resolved) return;
    updateField(fieldId, { visible: !resolved.visible });
  };

  const resetField = (fieldId: string) => {
    setDraft((prev) => removeOverride(prev, fieldId));
    if (editingFieldId === fieldId) setEditingFieldId(null);
  };

  const moveItem = (from: number, to: number) => {
    if (from === to) return;
    const list = [...draftResolved];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setDraft((prev) => {
      let updated = [...prev];
      list.forEach((col, idx) => {
        const master = masterMap.get(col.field_id);
        if (!master || idx === master.default_sequence) {
          // New position matches master default — remove any sequence override
          const existing = updated.find((o) => o.field_id === col.field_id);
          if (existing?.sequence !== undefined) {
            const { sequence: _, ...rest } = existing;
            const hasOtherProps = Object.keys(rest).some((k) => k !== 'field_id');
            if (hasOtherProps) {
              updated = updated.map((o) =>
                o.field_id === col.field_id ? (rest as ClientBrowseOverride) : o,
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
  };

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

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== toIndex) {
      moveItem(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, draftResolved]);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleResetAll = () => {
    onResetAll();
    onClose();
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

  return (
    <Drawer title="Customize Columns" onCloseClick={onClose}>
      <div className="cc-drawer" onKeyDown={handleKeyDown}>
        {!editingResolved ? (
          <>
            <p className="cc-drawer__hint">
              All fields from the master list are shown below.
              Toggle visibility, drag to reorder, or click Edit to override display settings.
              {customizedCount > 0 && (
                <span className="cc-drawer__override-count">
                  {' '}{customizedCount} field{customizedCount !== 1 ? 's' : ''} customized
                </span>
              )}
            </p>
            <div className="cc-drawer__list" ref={listRef}>
              {draftResolved.map((col, idx) => (
                <div
                  key={col.field_id}
                  className={[
                    'cc-drawer__item',
                    col.visible ? '' : 'cc-drawer__item--hidden',
                    dragOverIndex === idx && dragIndex !== idx ? 'cc-drawer__item--drag-over' : '',
                  ].filter(Boolean).join(' ')}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                >
                  <div className="cc-drawer__item-left">
                    <span className="cc-drawer__drag-handle" title="Drag to reorder">&#x2807;</span>
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={() => toggleVisible(col.field_id)}
                    />
                    <span className="cc-drawer__item-caption">{col.caption}</span>
                    <span className="cc-drawer__item-type">
                      {DATA_TYPE_LABELS[col.data_type]}
                    </span>
                    {col.has_override && (
                      <span className="cc-drawer__override-dot" title="Differs from master default" />
                    )}
                  </div>
                  <div className="cc-drawer__item-actions">
                    {col.has_override && (
                      <button
                        className="cc-drawer__reset-btn"
                        onClick={() => resetField(col.field_id)}
                        title="Reset to master default"
                      >
                        &#x21BA;
                      </button>
                    )}
                    <button
                      className="cc-drawer__arrow-btn"
                      onClick={() => moveItem(idx, idx - 1)}
                      disabled={idx === 0}
                      aria-label="Move up"
                    >
                      &#x25B2;
                    </button>
                    <button
                      className="cc-drawer__arrow-btn"
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
            <div className="cc-drawer__footer">
              <Button variant="secondary" onClick={handleResetAll}>Reset All</Button>
              <Flex style={{ gap: '0.5rem' }}>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleApply}>Apply</Button>
              </Flex>
            </div>
          </>
        ) : (
          <EditFieldView
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

interface EditFieldViewProps {
  resolved: ResolvedBrowseColumn;
  master: MasterBrowseField;
  onUpdate: (updates: Partial<Omit<ClientBrowseOverride, 'field_id'>>) => void;
  onReset: () => void;
  onBack: () => void;
}

const EditFieldView: React.FC<EditFieldViewProps> = ({
  resolved,
  master,
  onUpdate,
  onReset,
  onBack,
}) => {
  const captionDiffers = resolved.caption !== master.caption;
  const widthDiffers = resolved.width_px !== master.default_width_px;
  const formatDiffers = resolved.number_format !== master.number_format;
  const decimalsDiffers = resolved.decimal_places !== master.decimal_places;

  return (
    <div className="cc-drawer__edit">
      <Button size="S" variant="text" onClick={onBack} style={{ marginBottom: '0.75rem' }}>
        &larr; Back to list
      </Button>
      <h3 className="cc-drawer__edit-title">
        Edit: {resolved.caption}
        {resolved.has_override && (
          <span className="cc-drawer__override-dot cc-drawer__override-dot--inline" title="Differs from master default" />
        )}
      </h3>

      <div className="cc-drawer__edit-fields">
        <div className={captionDiffers ? 'cc-drawer__field--overridden' : ''}>
          <TextField
            label="Caption"
            value={resolved.caption}
            onChange={(v) => onUpdate({ caption: v || master.caption })}
            placeholder={master.caption}
          />
          {captionDiffers && (
            <span className="cc-drawer__field-default">
              Master default: {master.caption}
            </span>
          )}
        </div>

        <div className={widthDiffers ? 'cc-drawer__field--overridden' : ''}>
          <TextField
            label="Width (px)"
            value={String(resolved.width_px)}
            onChange={(v) => onUpdate({ width_px: parseInt(v) || master.default_width_px })}
            type="number"
            placeholder={String(master.default_width_px)}
          />
          {widthDiffers && (
            <span className="cc-drawer__field-default">
              Master default: {master.default_width_px}px
            </span>
          )}
        </div>

        {resolved.data_type === 'number' && (
          <div className={formatDiffers ? 'cc-drawer__field--overridden' : ''}>
            <SelectField
              label="Number Format"
              value={resolved.number_format || 'number'}
              onChange={(v) => onUpdate({ number_format: v as NumberFormat })}
              options={{
                values: NUMBER_FORMATS,
                getOptionName: (v) => NUMBER_FORMAT_LABELS[v] ?? v,
              }}
            />
            {formatDiffers && (
              <span className="cc-drawer__field-default">
                Master default: {NUMBER_FORMAT_LABELS[master.number_format] || master.number_format}
              </span>
            )}
          </div>
        )}

        {resolved.data_type === 'number' && (
          <div className={decimalsDiffers ? 'cc-drawer__field--overridden' : ''}>
            <TextField
              label="Decimal Places"
              value={String(resolved.decimal_places)}
              onChange={(v) => onUpdate({ decimal_places: Math.max(0, parseInt(v) || 0) })}
              type="number"
              placeholder={String(master.decimal_places)}
            />
            {decimalsDiffers && (
              <span className="cc-drawer__field-default">
                Master default: {master.decimal_places}
              </span>
            )}
          </div>
        )}

        <div className="cc-drawer__edit-preview">
          <span className="cc-drawer__edit-preview-label">Format Preview</span>
          <span className="cc-drawer__edit-preview-value">
            {formatCellValue(SAMPLE_VALUES[resolved.data_type], resolved)}
          </span>
        </div>

        <div className="cc-drawer__edit-meta">
          <span>
            Source:{' '}
            <code>
              {master.table_name
                ? `${master.table_name}.${master.column_name}`
                : `${master.column_name} (calculated)`}
            </code>
          </span>
          <span>Data type: <code>{master.data_type}</code> (from master, not editable)</span>
          <span>Display: <code>{master.display_style}</code> (from master, not editable)</span>
        </div>
      </div>

      {resolved.has_override && (
        <div className="cc-drawer__edit-reset">
          <Button variant="secondary" onClick={onReset}>
            Reset this field to master defaults
          </Button>
        </div>
      )}
    </div>
  );
};
