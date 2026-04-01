import React from 'react';
import { Modal, Button } from '../../ui';
import type { SavedBrowseView } from '../../types/savedView';

interface ManageViewsModalProps {
  personalViews: SavedBrowseView[];
  sharedViews: SavedBrowseView[];
  activeViewId: string | null;
  onSelectView: (viewId: string) => void;
  onDeleteView: (viewId: string) => void;
  onSetDefault: (viewId: string) => void;
  canEdit: (view: SavedBrowseView) => boolean;
  onClose: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}

export const ManageViewsModal: React.FC<ManageViewsModalProps> = ({
  personalViews,
  sharedViews,
  activeViewId,
  onSelectView,
  onDeleteView,
  onSetDefault,
  canEdit,
  onClose,
}) => {
  const allViews = [...personalViews, ...sharedViews];

  return (
    <Modal title="Manage Saved Views" onCloseClick={onClose}>
      <div className="mvm">
        {allViews.length === 0 ? (
          <p className="mvm__empty">No saved views yet. Use &ldquo;Save View&rdquo; to create one.</p>
        ) : (
          <>
            {personalViews.length > 0 && (
              <div className="mvm__section">
                <div className="mvm__section-title">{'\u{1F464}'} My Views</div>
                {personalViews.map((v) => (
                  <ViewRow
                    key={v.view_id}
                    view={v}
                    isActive={v.view_id === activeViewId}
                    editable={canEdit(v)}
                    onSelect={() => { onSelectView(v.view_id); onClose(); }}
                    onDelete={() => onDeleteView(v.view_id)}
                    onSetDefault={() => onSetDefault(v.view_id)}
                  />
                ))}
              </div>
            )}

            {sharedViews.length > 0 && (
              <div className="mvm__section">
                <div className="mvm__section-title">{'\u{1F310}'} Shared Views</div>
                {sharedViews.map((v) => (
                  <ViewRow
                    key={v.view_id}
                    view={v}
                    isActive={v.view_id === activeViewId}
                    editable={false}
                    onSelect={() => { onSelectView(v.view_id); onClose(); }}
                    onDelete={undefined}
                    onSetDefault={undefined}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div className="mvm__footer">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

interface ViewRowProps {
  view: SavedBrowseView;
  isActive: boolean;
  editable: boolean;
  onSelect: () => void;
  onDelete: (() => void) | undefined;
  onSetDefault: (() => void) | undefined;
}

const ViewRow: React.FC<ViewRowProps> = ({
  view,
  isActive,
  editable,
  onSelect,
  onDelete,
  onSetDefault,
}) => (
  <div className={`mvm__row ${isActive ? 'mvm__row--active' : ''}`}>
    <button className="mvm__row-select" onClick={onSelect}>
      <span className="mvm__row-name">{view.name}</span>
      <span className="mvm__row-meta">
        {view.scope === 'shared' && <span>by {view.owner}</span>}
        <span>{formatDate(view.updated_at)}</span>
        {view.is_default && <span className="mvm__row-default-tag">default</span>}
        {isActive && <span className="mvm__row-active-tag">active</span>}
      </span>
    </button>
    {editable && (
      <div className="mvm__row-actions">
        {!view.is_default && onSetDefault && (
          <button
            className="mvm__row-action"
            onClick={onSetDefault}
            title="Set as default"
          >
            {'\u2606'}
          </button>
        )}
        {onDelete && (
          <button
            className="mvm__row-action mvm__row-action--danger"
            onClick={onDelete}
            title="Delete view"
          >
            &times;
          </button>
        )}
      </div>
    )}
  </div>
);
