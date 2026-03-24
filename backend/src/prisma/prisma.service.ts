import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = `${process.env.DATABASE_URL}`;
    const pool = new Pool({ connectionString });
    // Adapter typings can disagree across nested @types/pg copies; runtime Pool is valid.
    const adapter = new PrismaPg(pool as any);
    super({ adapter });
  }

  async onModuleInit() {
    console.log('Connecting to database...');
    try {
      await this.$connect();
      console.log('Connected to database!');
    } catch (error) {
      console.error('Failed to connect to database', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
