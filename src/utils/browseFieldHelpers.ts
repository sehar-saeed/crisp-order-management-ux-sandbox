import type {
  ClientBrowseOverride,
  NumberFormat,
  DataType,
} from '../types/browseConfig';

/**
 * Shared helpers and constants for browse field customization.
 * Used by both the Customize Columns drawer (quick edit) and
 * the full-page configuration view.
 */

export function upsertOverride(
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

export function removeOverride(
  overrides: ClientBrowseOverride[],
  fieldId: string,
): ClientBrowseOverride[] {
  return overrides.filter((o) => o.field_id !== fieldId);
}

export const NUMBER_FORMATS: NumberFormat[] = ['number', 'dollars', 'percent'];

export const DATA_TYPE_LABELS: Record<DataType, string> = {
  string: 'String',
  number: 'Number',
  date: 'Date',
};

export const NUMBER_FORMAT_LABELS: Record<string, string> = {
  number: 'Plain Number',
  dollars: 'Dollars ($)',
  percent: 'Percent (%)',
};

export const SAMPLE_VALUES: Record<DataType, any> = {
  number: 12345.6789,
  date: '2025-03-15',
  string: 'Sample Text',
};
