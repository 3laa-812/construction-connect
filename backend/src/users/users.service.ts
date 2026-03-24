import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
      include: { company: true },
    });
  }

  async findOne(id: string, user?: JwtPayload): Promise<User | null> {
    const found = await this.prisma.user.findUnique({
      where: { id },
      include: { company: true },
    });
    if (!found) {
      return null;
    }
    if (user && user.role !== 'ADMIN') {
      if (found.id !== user.sub && found.company_id !== user.companyId) {
        throw new ForbiddenException('Access denied');
      }
    }
    return found;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone },
      include: { company: true },
    });
  }

  async findAll(user: JwtPayload): Promise<User[]> {
    if (user.role === 'ADMIN') {
      return this.prisma.user.findMany({ include: { company: true } });
    }
    if (!user.companyId) {
      return [];
    }
    return this.prisma.user.findMany({
      where: { company_id: user.companyId },
      include: { company: true },
    });
  }

  async update(
    id: string,
    data: Prisma.UserUpdateInput,
    user: JwtPayload,
  ): Promise<User> {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== 'ADMIN') {
      if (target.id !== user.sub && target.company_id !== user.companyId) {
        throw new ForbiddenException('Access denied');
      }
    }
    return this.prisma.user.update({
      where: { id },
      data,
      include: { company: true },
    });
  }

  async remove(id: string, user: JwtPayload): Promise<User> {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== 'ADMIN') {
      if (target.id !== user.sub && target.company_id !== user.companyId) {
        throw new ForbiddenException('Access denied');
      }
    }
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
