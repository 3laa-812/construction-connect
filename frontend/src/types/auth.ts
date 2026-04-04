export type UserRole = 'contractor' | 'supplier' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  // KYB Info (Partial)
  companyName?: string;
  crNumber?: string;
  companyId?: string;
  companyType?: 'CONTRACTOR' | 'SUPPLIER';
  /** ISO country from company (e.g. SA, EG) — from JWT / login payload. */
  companyCountry?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
