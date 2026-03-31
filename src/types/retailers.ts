export interface Retailer {
  retailerUid: string;
  name: string;
  shortCode: string;
  description: string;
  activeYn: string;
  deletedYn: string;
  createdDate?: string;
  createdBy?: string;
  modifiedDate?: string;
  modifiedBy?: string;
}
