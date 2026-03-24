import { SetMetadata } from '@nestjs/common';
import { AppRole } from '../interfaces/jwt-payload.interface';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
