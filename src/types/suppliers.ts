export interface Supplier {
  supplierUid: string;
  name: string;
  shortCode: string;
  email: string;
  phoneNumber: string;
  activeYn: string;
  deletedYn: string;
  createdDate?: string;
  createdBy?: string;
  modifiedDate?: string;
  modifiedBy?: string;
}

export interface CreateSupplierRequest {
  name: string;
  shortCode: string;
  email: string;
  phoneNumber: string;
}

export interface UpdateSupplierRequest extends CreateSupplierRequest {
  supplierUid: string;
}
