import type { ClientBrowseOverride } from './browseConfig';

export type ViewScope = 'personal' | 'shared';

/**
 * A saved browse view persists a named column configuration.
 *
 * In production this maps to a saved_views table.
 * Currently mocked with localStorage.
 */
export interface SavedBrowseView {
  view_id: string;
  name: string;
  owner: string;
  scope: ViewScope;
  is_default: boolean;
  column_config: ClientBrowseOverride[];
  created_at: string;
  updated_at: string;
}
