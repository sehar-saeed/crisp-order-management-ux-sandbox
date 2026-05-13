import type { ClientBrowseOverride } from './browseConfig';
import type { SystemBrowseViewId } from '../components/orders/systemBrowseViews';

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
  /** Built-in system state this saved view opens with (dataset/actions/filter context). */
  system_view_id?: SystemBrowseViewId;
  column_config: ClientBrowseOverride[];
  /** Column layout when browsing failed import / EDI rows (same saved view). */
  ingestion_column_config?: ClientBrowseOverride[];
  created_at: string;
  updated_at: string;
}
