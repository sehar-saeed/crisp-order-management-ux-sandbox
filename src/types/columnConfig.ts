export type DataType = 'string' | 'number' | 'date';
export type NumberFormat = '' | 'dollars' | 'number' | 'percent';
export type DisplayStyle = 'default' | 'status_badge';

export interface ColumnConfig {
  id: string;
  caption: string;
  width: number;
  table_name: string;
  column_name: string;
  data_type: DataType;
  number_format: NumberFormat;
  decimal_places: number;
  display_style: DisplayStyle;
  visible: boolean;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column_name: string;
  direction: SortDirection;
}
