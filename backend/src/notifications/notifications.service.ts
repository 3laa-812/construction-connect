import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Notification } from '@prisma/client';

export type CreateNotificationInput = {
  title: string;
  body: string;
  type: string;
  entityId?: string | null;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateNotificationInput): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        user_id: userId,
        title: input.title,
        body: input.body,
        type: input.type,
        entity_id: input.entityId ?? undefined,
      },
    });
  }

  async createForUsers(
    userIds: string[],
    input: CreateNotificationInput,
  ): Promise<void> {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) {
      return;
    }
    try {
      await this.prisma.notification.createMany({
        data: unique.map((user_id) => ({
          user_id,
          title: input.title,
          body: input.body,
          type: input.type,
          entity_id: input.entityId ?? null,
        })),
      });
    } catch (err) {
      this.logger.warn(
        `createForUsers failed: ${
          err instanceof Error ? err.message : 'unknown error'
        }`,
      );
    }
  }

  async notifyCompanyUsers(
    companyId: string,
    input: CreateNotificationInput,
  ): Promise<void> {
    if (!companyId) {
      return;
    }
    const users = await this.prisma.user.findMany({
      where: { company_id: companyId, is_active: true },
      select: { id: true },
    });
    await this.createForUsers(
      users.map((u) => u.id),
      input,
    );
  }

  async findForUser(
    userId: string,
    opts?: { unreadOnly?: boolean; limit?: number },
  ): Promise<Notification[]> {
    const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
    return this.prisma.notification.findMany({
      where: {
        user_id: userId,
        ...(opts?.unreadOnly ? { is_read: false } : {}),
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const existing = await this.prisma.notification.findFirst({
      where: { id, user_id: userId },
    });
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { is_read: true },
    });
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
    return { count: res.count };
  }
}
