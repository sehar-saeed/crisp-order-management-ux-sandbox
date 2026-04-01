import { useState, useCallback, useMemo } from 'react';
import type { SavedBrowseView, ViewScope } from '../types/savedView';
import type { ClientBrowseOverride } from '../types/browseConfig';
import { seedSavedViews } from '../mock/orders/defaultSavedViews';

/**
 * localStorage keys — mock persistence standing in for API calls
 * to a saved_views table in the backend.
 */
const VIEWS_KEY = 'crisp:order-browse:saved-views';
const ACTIVE_VIEW_KEY = 'crisp:order-browse:active-view-id';

const CURRENT_USER = 'currentUser';

function loadViews(): SavedBrowseView[] {
  try {
    const raw = localStorage.getItem(VIEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* corrupt or unavailable */ }
  return seedSavedViews.map((v) => ({ ...v, column_config: v.column_config.map((c) => ({ ...c })) }));
}

function persistViews(views: SavedBrowseView[]) {
  try {
    localStorage.setItem(VIEWS_KEY, JSON.stringify(views));
  } catch { /* storage full or unavailable */ }
}

function loadActiveViewId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_VIEW_KEY);
  } catch { return null; }
}

function persistActiveViewId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_VIEW_KEY, id);
    else localStorage.removeItem(ACTIVE_VIEW_KEY);
  } catch { /* unavailable */ }
}

function generateViewId(): string {
  return 'view-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

export interface SaveViewInput {
  name: string;
  scope: ViewScope;
  is_default: boolean;
  column_config: ClientBrowseOverride[];
}

export function useSavedViews() {
  const [views, setViews] = useState<SavedBrowseView[]>(loadViews);
  const [activeViewId, setActiveViewId] = useState<string | null>(loadActiveViewId);

  const personalViews = useMemo(
    () => views.filter((v) => v.scope === 'personal' && v.owner === CURRENT_USER),
    [views],
  );

  const sharedViews = useMemo(
    () => views.filter((v) => v.scope === 'shared'),
    [views],
  );

  const activeView = useMemo(
    () => (activeViewId ? views.find((v) => v.view_id === activeViewId) ?? null : null),
    [views, activeViewId],
  );

  const defaultView = useMemo(
    () => views.find((v) => v.is_default && v.owner === CURRENT_USER) ?? null,
    [views],
  );

  const selectView = useCallback((viewId: string | null) => {
    setActiveViewId(viewId);
    persistActiveViewId(viewId);
  }, []);

  const saveView = useCallback((input: SaveViewInput): SavedBrowseView => {
    const now = new Date().toISOString();
    const newView: SavedBrowseView = {
      view_id: generateViewId(),
      name: input.name,
      owner: CURRENT_USER,
      scope: input.scope,
      is_default: input.is_default,
      column_config: input.column_config.map((c) => ({ ...c })),
      created_at: now,
      updated_at: now,
    };
    setViews((prev) => {
      let updated = [...prev, newView];
      if (input.is_default) {
        updated = updated.map((v) =>
          v.view_id !== newView.view_id && v.owner === CURRENT_USER
            ? { ...v, is_default: false }
            : v,
        );
      }
      persistViews(updated);
      return updated;
    });
    setActiveViewId(newView.view_id);
    persistActiveViewId(newView.view_id);
    return newView;
  }, []);

  const updateView = useCallback((viewId: string, updates: Partial<Pick<SavedBrowseView, 'name' | 'column_config' | 'is_default'>>) => {
    setViews((prev) => {
      let updated = prev.map((v) => {
        if (v.view_id !== viewId) return v;
        return { ...v, ...updates, updated_at: new Date().toISOString() };
      });
      if (updates.is_default) {
        updated = updated.map((v) =>
          v.view_id !== viewId && v.owner === CURRENT_USER
            ? { ...v, is_default: false }
            : v,
        );
      }
      persistViews(updated);
      return updated;
    });
  }, []);

  const deleteView = useCallback((viewId: string) => {
    setViews((prev) => {
      const updated = prev.filter((v) => v.view_id !== viewId);
      persistViews(updated);
      return updated;
    });
    if (activeViewId === viewId) {
      setActiveViewId(null);
      persistActiveViewId(null);
    }
  }, [activeViewId]);

  const canEditView = useCallback((view: SavedBrowseView): boolean => {
    return view.scope === 'personal' && view.owner === CURRENT_USER;
  }, []);

  /**
   * Returns the column config to load on startup:
   * user's default view → last active view → null (system default).
   */
  const getStartupConfig = useCallback((): { viewId: string; config: ClientBrowseOverride[] } | null => {
    const userDefault = views.find((v) => v.is_default && v.owner === CURRENT_USER);
    if (userDefault) return { viewId: userDefault.view_id, config: userDefault.column_config };

    if (activeViewId) {
      const active = views.find((v) => v.view_id === activeViewId);
      if (active) return { viewId: active.view_id, config: active.column_config };
    }

    return null;
  }, [views, activeViewId]);

  return {
    views,
    personalViews,
    sharedViews,
    activeView,
    activeViewId,
    defaultView,
    selectView,
    saveView,
    updateView,
    deleteView,
    canEditView,
    getStartupConfig,
  };
}
