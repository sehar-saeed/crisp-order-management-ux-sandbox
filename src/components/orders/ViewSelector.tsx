import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { SavedBrowseView } from '../../types/savedView';

interface ViewSelectorProps {
  personalViews: SavedBrowseView[];
  sharedViews: SavedBrowseView[];
  activeView: SavedBrowseView | null;
  isModified: boolean;
  onSelectView: (viewId: string) => void;
  onSelectSystemDefault: () => void;
  onSaveNewView: () => void;
  onManageViews: () => void;
}

export const ViewSelector: React.FC<ViewSelectorProps> = ({
  personalViews,
  sharedViews,
  activeView,
  isModified,
  onSelectView,
  onSelectSystemDefault,
  onSaveNewView,
  onManageViews,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const q = search.trim().toLowerCase();

  const filteredPersonal = useMemo(
    () => q ? personalViews.filter((v) => v.name.toLowerCase().includes(q)) : personalViews,
    [personalViews, q],
  );
  const filteredShared = useMemo(
    () => q ? sharedViews.filter((v) => v.name.toLowerCase().includes(q)) : sharedViews,
    [sharedViews, q],
  );

  const handleSelect = (viewId: string) => {
    onSelectView(viewId);
    setOpen(false);
  };

  const scopeIcon = activeView
    ? (activeView.scope === 'personal' ? '\u{1F464}' : '\u{1F310}')
    : '\u25A3';

  const displayName = activeView ? activeView.name : 'System Default';

  return (
    <div className="vs" ref={ref}>
      <button
        className={`vs__trigger ${isModified ? 'vs__trigger--modified' : ''}`}
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="vs__trigger-icon">{scopeIcon}</span>
        <span className="vs__trigger-label">{displayName}</span>
        {activeView && (
          <span className={`vs__scope-badge vs__scope-badge--${activeView.scope}`}>
            {activeView.scope === 'personal' ? 'Mine' : 'Shared'}
          </span>
        )}
        {activeView?.is_default && (
          <span className="vs__default-badge">default</span>
        )}
        {isModified && <span className="vs__modified-dot" title="Unsaved changes" />}
        <span className="vs__caret">{open ? '\u25B4' : '\u25BE'}</span>
      </button>

      {open && (
        <div className="vs__dropdown" role="listbox">
          <div className="vs__search-box">
            <input
              ref={searchRef}
              className="vs__search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search views\u2026"
              aria-label="Search views"
            />
          </div>

          {/* ── Current ── */}
          {!q && (
            <div className="vs__group">
              <div className="vs__group-title">Current</div>
              <button
                className={`vs__row ${!activeView ? 'vs__row--active' : ''}`}
                onClick={() => { onSelectSystemDefault(); setOpen(false); }}
                role="option"
                aria-selected={!activeView}
              >
                <span className="vs__row-icon">{'\u25A3'}</span>
                <span className="vs__row-body">
                  <span className="vs__row-name">System Default</span>
                  <span className="vs__row-meta">Base column layout</span>
                </span>
              </button>
            </div>
          )}

          {/* ── My Views ── */}
          {filteredPersonal.length > 0 && (
            <div className="vs__group">
              <div className="vs__group-title">{'\u{1F464}'} My Views</div>
              {filteredPersonal.map((v) => (
                <button
                  key={v.view_id}
                  className={`vs__row ${activeView?.view_id === v.view_id ? 'vs__row--active' : ''}`}
                  onClick={() => handleSelect(v.view_id)}
                  role="option"
                  aria-selected={activeView?.view_id === v.view_id}
                >
                  <span className="vs__row-icon">{'\u{1F464}'}</span>
                  <span className="vs__row-body">
                    <span className="vs__row-name">
                      {v.name}
                      {v.is_default && <span className="vs__row-default-tag">default</span>}
                    </span>
                    <span className="vs__row-meta">Personal</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ── Shared Views ── */}
          {filteredShared.length > 0 && (
            <div className="vs__group">
              <div className="vs__group-title">{'\u{1F310}'} Shared Views</div>
              {filteredShared.map((v) => (
                <button
                  key={v.view_id}
                  className={`vs__row ${activeView?.view_id === v.view_id ? 'vs__row--active' : ''}`}
                  onClick={() => handleSelect(v.view_id)}
                  role="option"
                  aria-selected={activeView?.view_id === v.view_id}
                >
                  <span className="vs__row-icon">{'\u{1F310}'}</span>
                  <span className="vs__row-body">
                    <span className="vs__row-name">{v.name}</span>
                    <span className="vs__row-meta">Shared &middot; {v.owner}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {q && filteredPersonal.length === 0 && filteredShared.length === 0 && (
            <div className="vs__empty">No views matching &ldquo;{search}&rdquo;</div>
          )}

          {/* ── Bottom Actions ── */}
          <div className="vs__actions">
            <button className="vs__action-btn" onClick={() => { onSaveNewView(); setOpen(false); }}>
              <span className="vs__action-icon">+</span> Save current as new view
            </button>
            <button className="vs__action-btn" onClick={() => { onManageViews(); setOpen(false); }}>
              <span className="vs__action-icon">{'\u2699'}</span> Manage views
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
