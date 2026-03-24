import { Company, Role, User } from '@prisma/client';
import { AppRole, JwtPayload } from '../common/interfaces/jwt-payload.interface';

type UserWithCompany = User & { company?: Company | null };

export function buildJwtPayload(user: UserWithCompany): JwtPayload {
  let role: AppRole = 'CONTRACTOR';
  if (!user.company_id && user.role === Role.ADMIN) {
    role = 'ADMIN';
  } else if (user.company?.type === 'SUPPLIER') {
    role = 'SUPPLIER';
  } else if (user.company?.type === 'CONTRACTOR') {
    role = 'CONTRACTOR';
  }

  return {
    sub: user.id,
    email: user.email,
    companyId: user.company_id ?? '',
    role,
  };
}
