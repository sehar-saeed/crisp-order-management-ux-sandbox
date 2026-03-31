export type QuickFindMode = 'startsWith' | 'contains' | 'endsWith';

export interface OrderBrowseRow {
  id: string;
  orderNumber: string;
  retailerName: string;
  supplierName: string;
  orderDate: string;
  shipDate: string;
  invoiceStatus: string;
  shipmentStatus: string;
  commStatus: string;
  totalAmount: number;
  itemCount: number;
}
