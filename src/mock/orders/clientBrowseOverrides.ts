import type { ClientBrowseOverride } from '../../types/browseConfig';

/**
 * Seed data for the **custom_browse** client table.
 *
 * An empty array means "no client customizations — use master defaults."
 *
 * In production this is fetched from and persisted to the backend API.
 * Here it seeds localStorage on first load as a stand-in for
 * API persistence.
 */
export const defaultClientOverrides: ClientBrowseOverride[] = [];
