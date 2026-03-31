export interface User {
  userUid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  activeYn: string;
  createdDate?: string;
  createdBy?: string;
}
