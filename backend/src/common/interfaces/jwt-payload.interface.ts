/** Business-facing role derived from company type + platform admin (no company). */
export type AppRole = 'CONTRACTOR' | 'SUPPLIER' | 'ADMIN';

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  role: AppRole;
  companyCountry?: string;
}
