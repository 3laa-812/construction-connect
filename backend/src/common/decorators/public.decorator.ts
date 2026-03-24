import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks route as accessible without JWT (used by global JwtAuthGuard). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
