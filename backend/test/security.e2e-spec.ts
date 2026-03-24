import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

/**
 * Section 1 — API security smoke tests (stub / extension point for full auth flows).
 */
describe('Security (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health is public (200 or 503 if DB down)', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.status).toBe('ok');
    }
  });

  it('GET / without Authorization returns 401', () => {
    return request(app.getHttpServer()).get('/').expect(401);
  });
});
