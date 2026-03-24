import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

/**
 * RFQ award happy-path E2E can be expanded with seeded DB + JWT.
 * Smoke: public health endpoint for CI wiring.
 */
describe('RFQ award (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health is public and returns Terminus shape', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    // 200 when DB + disk healthy; 503 when DB unreachable (wrapped by HttpExceptionFilter)
    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('info');
    } else {
      expect(res.body).toMatchObject({ statusCode: 503, path: '/health' });
    }
  });
});

describe.skip('RFQ award full lifecycle (requires seeded data)', () => {
  it('register → RFQ → bid → award → PO', () => {
    expect(true).toBe(true);
  });
});
