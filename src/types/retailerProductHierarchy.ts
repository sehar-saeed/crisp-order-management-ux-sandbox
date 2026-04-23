export interface Department {
  id: string;
  retailerUid: string;
  deptCode: string;
  deptName: string;
  displayName: string;
  createdDate?: string;
  createdBy: string;
  source: string;
  modifiedDate?: string;
  modifiedBy: string;
}

export interface DepartmentClass {
  id: string;
  departmentUid: string;
  retailerUid: string;
  classCode: string;
  className: string;
  displayName: string;
  createdDate?: string;
  createdBy: string;
  source: string;
  modifiedDate?: string;
  modifiedBy: string;
}

export interface Subclass {
  id: string;
  classUid: string;
  departmentUid: string;
  retailerUid: string;
  subclassCode: string;
  subclassName: string;
  displayName: string;
  createdDate?: string;
  createdBy: string;
  source: string;
  modifiedDate?: string;
  modifiedBy: string;
}
