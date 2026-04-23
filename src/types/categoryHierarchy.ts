export interface Category {
  id: string;
  supplierUid: string;
  code: string;
  name: string;
  createdDate?: string;
  createdBy?: string;
  source?: string;
  modifiedDate?: string;
  modifiedBy?: string;
  deletedYn?: string;
  defaultCommRate?: number | null;
}

export interface Subcategory {
  id: string;
  categoryUid: string;
  supplierUid: string;
  code: string;
  name: string;
  createdDate?: string;
  createdBy?: string;
  source?: string;
  modifiedDate?: string;
  modifiedBy?: string;
  deletedYn?: string;
  defaultCommRate?: number | null;
}
