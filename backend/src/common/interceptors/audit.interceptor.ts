import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

type RequestUser = {
  sub?: string;
  companyId?: string;
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);
  private readonly mutatingMethods = new Set(['POST', 'PATCH', 'DELETE']);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method?.toUpperCase();

    if (!this.mutatingMethods.has(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseBody: unknown) => {
        const user = req.user as RequestUser | undefined;
        if (!user?.sub || !user.companyId) {
          return;
        }

        const body = responseBody as { id?: string } | undefined;
        const entityId =
          (body?.id && String(body.id)) ||
          String((req.params as Record<string, string> | undefined)?.id || '');

        const routePath = req.route?.path || req.path || '';
        const action = `${method} ${req.baseUrl || ''}${routePath}`;
        const entityType =
          req.baseUrl?.split('/').filter(Boolean).pop()?.toUpperCase() || 'UNKNOWN';

        void this.prisma.auditLog
          .create({
            data: {
              user_id: user.sub,
              company_id: user.companyId,
              action,
              entity_type: entityType,
              entity_id: entityId || 'unknown',
              new_value: responseBody as object,
              ip_address: req.ip || null,
              user_agent:
                typeof req.headers['user-agent'] === 'string'
                  ? req.headers['user-agent']
                  : null,
            },
          })
          .catch((error: unknown) => {
            this.logger.warn(
              `Audit log insert failed: ${
                error instanceof Error ? error.message : 'unknown error'
              }`,
            );
          });
      }),
    );
  }
}
