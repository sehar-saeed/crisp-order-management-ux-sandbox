import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headline, Panel, Button, TextField, SelectField, Flex } from '../../ui';
import { useBrowseConfig, resolveColumns } from '../../hooks/useBrowseConfig';
import { formatCellValue } from '../../components/table/ConfigDrivenGrid';
import { notificationService } from '../../services/NotificationService';
import type {
  MasterBrowseField,
  ClientBrowseOverride,
  ResolvedBrowseColumn,
  NumberFormat,
} from '../../types/browseConfig';
import {
  upsertOverride,
  removeOverride,
  NUMBER_FORMATS,
  DATA_TYPE_LABELS,
  NUMBER_FORMAT_LABELS,
  SAMPLE_VALUES,
} from '../../utils/browseFieldHelpers';
import '../../styles/column-customize.css';

export const ColumnCustomizationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    masterFields,
    clientOverrides,
    applyOverrides,
    resetAllOverrides,
  } = useBrowseConfig();

  const [draft, setDraft] = useState<ClientBrowseOverride[]>(
    () => clientOverrides.map((o) => ({ ...o })),
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    () => masterFields[0]?.field_id ?? null,
  );
  const [searchQuery, setSearchQuery] = useState('');

  const masterMap = useMemo(
    () => new Map(masterFields.map((m) => [m.field_id, m])),
    [masterFields],
  );

  const draftResolved = useMemo(
    () => resolveColumns([...masterFields], draft),
    [masterFields, draft],
  );

  const filteredResolved = useMemo(() => {
    if (!searchQuery.trim()) return draftResolved;
    const q = searchQuery.trim().toLowerCase();
    return draftResolved.filter(
      (c) =>
        c.caption.toLowerCase().includes(q) ||
        c.column_name.toLowerCase().includes(q) ||
        c.data_type.toLowerCase().includes(q),
    );
  }, [draftResolved, searchQuery]);

  const customizedCount = draftResolved.filter((c) => c.has_override).length;
  const visibleCount = draftResolved.filter((c) => c.visible).length;

  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(clientOverrides);
  }, [draft, clientOverrides]);

  const selectedResolved = selectedFieldId
    ? draftResolved.find((c) => c.field_id === selectedFieldId) ?? null
    : null;
  const selectedMaster = selectedFieldId
    ? masterMap.get(selectedFieldId) ?? null
    : null;

  const updateField = useCallback((fieldId: string, updates: Partial<Omit<ClientBrowseOverride, 'field_id'>>) => {
    setDraft((prev) => upsertOverride(prev, fieldId, updates));
  }, []);

  const toggleVisible = useCallback((fieldId: string) => {
    const resolved = draftResolved.find((c) => c.field_id === fieldId);
    if (!resolved) return;
    setDraft((prev) => upsertOverride(prev, fieldId, { visible: !resolved.visible }));
  }, [draftResolved]);

  const resetField = useCallback((fieldId: string) => {
    setDraft((prev) => removeOverride(prev, fieldId));
  }, []);

  const moveItem = useCallback((from: number, to: number) => {
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
  }, [draftResolved, masterMap]);

  const handleSave = () => {
    applyOverrides(draft);
    notificationService.success('Column configuration saved');
  };

  const handleResetAll = () => {
    resetAllOverrides();
    setDraft([]);
    setSelectedFieldId(masterFields[0]?.field_id ?? null);
    notificationService.success('All customizations reset to master defaults');
  };

  const handleBack = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard and leave?')) return;
    navigate('/orders');
  };

  return (
    <div className="cc-page">
      <div className="cc-page__header">
        <div className="cc-page__header-top">
          <div>
            <Button size="S" variant="text" onClick={handleBack}>&larr; Back to Orders</Button>
            <Headline as="h1">Customize Order Browse</Headline>
            <p className="cc-page__desc">
              Configure which columns appear in the Order Browse grid, their display order,
              captions, widths, and formatting. Changes are saved to your client configuration.
            </p>
          </div>
          <div className="cc-page__header-stats">
            <span className="cc-page__stat">
              <strong>{visibleCount}</strong> of {draftResolved.length} visible
            </span>
            {customizedCount > 0 && (
              <span className="cc-page__stat cc-page__stat--override">
                {customizedCount} customized
              </span>
            )}
            {isDirty && (
              <span className="cc-page__stat cc-page__stat--dirty">Unsaved changes</span>
            )}
          </div>
        </div>
        <div className="cc-page__header-actions">
          <Button variant="secondary" onClick={handleResetAll}>Reset All to Defaults</Button>
          <Flex style={{ gap: '0.5rem' }}>
            <Button variant="secondary" onClick={handleBack}>Cancel</Button>
            <Button onClick={handleSave} disabled={!isDirty}>Save Changes</Button>
          </Flex>
        </div>
      </div>

      <div className="cc-page__body">
        {/* ── Left Panel: Field List ── */}
        <Panel className="cc-page__left">
          <div className="cc-page__search">
            <TextField
              label=""
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search fields..."
            />
          </div>
          <div className="cc-page__field-list">
            {filteredResolved.map((col) => {
              const globalIdx = draftResolved.findIndex((c) => c.field_id === col.field_id);
              const isSelected = col.field_id === selectedFieldId;
              return (
                <div
                  key={col.field_id}
                  className={[
                    'cc-page__field-item',
                    isSelected ? 'cc-page__field-item--selected' : '',
                    !col.visible ? 'cc-page__field-item--hidden' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedFieldId(col.field_id)}
                >
                  <div className="cc-page__field-item-left">
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleVisible(col.field_id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="cc-page__field-item-info">
                      <span className="cc-page__field-item-caption">{col.caption}</span>
                      <span className="cc-page__field-item-meta">
                        {DATA_TYPE_LABELS[col.data_type]}
                        {col.table_name ? ` \u00b7 ${col.table_name}.${col.column_name}` : ` \u00b7 ${col.column_name} (calc)`}
                      </span>
                    </div>
                    {col.has_override && (
                      <span className="cc-drawer__override-dot" title="Differs from master default" />
                    )}
                  </div>
                  <div className="cc-page__field-item-right">
                    <button
                      className="cc-drawer__arrow-btn"
                      onClick={(e) => { e.stopPropagation(); moveItem(globalIdx, globalIdx - 1); }}
                      disabled={globalIdx === 0}
                      aria-label="Move up"
                    >
                      &#x25B2;
                    </button>
                    <button
                      className="cc-drawer__arrow-btn"
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
              <div className="cc-page__no-results">
                No fields matching "{searchQuery}"
              </div>
            )}
          </div>
        </Panel>

        {/* ── Right Panel: Field Editor ── */}
        <Panel className="cc-page__right">
          {selectedResolved && selectedMaster ? (
            <FieldEditor
              resolved={selectedResolved}
              master={selectedMaster}
              onUpdate={(updates) => updateField(selectedResolved.field_id, updates)}
              onReset={() => resetField(selectedResolved.field_id)}
            />
          ) : (
            <div className="cc-page__empty-editor">
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
  resolved: ResolvedBrowseColumn;
  master: MasterBrowseField;
  onUpdate: (updates: Partial<Omit<ClientBrowseOverride, 'field_id'>>) => void;
  onReset: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  resolved,
  master,
  onUpdate,
  onReset,
}) => {
  const captionDiffers = resolved.caption !== master.caption;
  const widthDiffers = resolved.width_px !== master.default_width_px;
  const formatDiffers = resolved.number_format !== master.number_format;
  const decimalsDiffers = resolved.decimal_places !== master.decimal_places;
  const visibleDiffers = resolved.visible !== master.default_visible;

  return (
    <div className="cc-editor">
      <div className="cc-editor__header">
        <h2 className="cc-editor__title">
          {resolved.caption}
          {resolved.has_override && (
            <span className="cc-drawer__override-dot cc-drawer__override-dot--inline" title="Differs from master default" />
          )}
        </h2>
        <div className="cc-editor__source">
          {master.table_name
            ? <code>{master.table_name}.{master.column_name}</code>
            : <code>{master.column_name} (calculated)</code>}
          {' \u00b7 '}
          <code>{master.data_type}</code>
          {' \u00b7 '}
          <code>{master.display_style}</code>
        </div>
      </div>

      <div className="cc-editor__grid">
        <div className="cc-editor__section">
          <h3 className="cc-editor__section-title">Display</h3>
          <div className={captionDiffers ? 'cc-drawer__field--overridden' : ''}>
            <TextField
              label="Caption"
              value={resolved.caption}
              onChange={(v) => onUpdate({ caption: v || master.caption })}
              placeholder={master.caption}
            />
            {captionDiffers && (
              <span className="cc-drawer__field-default">Master default: {master.caption}</span>
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
              <span className="cc-drawer__field-default">Master default: {master.default_width_px}px</span>
            )}
          </div>

          <div className={visibleDiffers ? 'cc-drawer__field--overridden' : ''}>
            <label className="cc-editor__checkbox-label">
              <input
                type="checkbox"
                checked={resolved.visible}
                onChange={() => onUpdate({ visible: !resolved.visible })}
              />
              Visible in grid
            </label>
            {visibleDiffers && (
              <span className="cc-drawer__field-default">
                Master default: {master.default_visible ? 'Visible' : 'Hidden'}
              </span>
            )}
          </div>
        </div>

        {resolved.data_type === 'number' && (
          <div className="cc-editor__section">
            <h3 className="cc-editor__section-title">Formatting</h3>
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

            <div className={decimalsDiffers ? 'cc-drawer__field--overridden' : ''}>
              <TextField
                label="Decimal Places"
                value={String(resolved.decimal_places)}
                onChange={(v) => onUpdate({ decimal_places: Math.max(0, parseInt(v) || 0) })}
                type="number"
                placeholder={String(master.decimal_places)}
              />
              {decimalsDiffers && (
                <span className="cc-drawer__field-default">Master default: {master.decimal_places}</span>
              )}
            </div>
          </div>
        )}

        <div className="cc-editor__section">
          <h3 className="cc-editor__section-title">Preview</h3>
          <div className="cc-drawer__edit-preview">
            <span className="cc-drawer__edit-preview-label">Formatted Value</span>
            <span className="cc-drawer__edit-preview-value">
              {formatCellValue(SAMPLE_VALUES[resolved.data_type], resolved)}
            </span>
          </div>
        </div>
      </div>

      {resolved.has_override && (
        <div className="cc-editor__reset">
          <Button variant="secondary" onClick={onReset}>
            Reset this field to master defaults
          </Button>
        </div>
      )}
    </div>
  );
};
