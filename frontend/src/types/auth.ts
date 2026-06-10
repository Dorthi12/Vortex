export type UserRole = 'citizen' | 'official' | 'emergency' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}
