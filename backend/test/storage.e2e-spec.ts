import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

/**
 * Section 6 — upload endpoints require authentication (stub; expand with multipart + S3 mocks).
 */
describe('Storage & uploads (e2e)', () => {
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

  it('POST /companies/c1/documents without JWT returns 401', () => {
    return request(app.getHttpServer())
      .post('/companies/c1/documents')
      .expect(401);
  });

  it('POST /rfqs/r1/attachments without JWT returns 401', () => {
    return request(app.getHttpServer())
      .post('/rfqs/r1/attachments')
      .expect(401);
  });

  it('POST /daily-logs/photos without JWT returns 401', () => {
    return request(app.getHttpServer())
      .post('/daily-logs/photos')
      .expect(401);
  });

  it('PATCH /companies/c1/verify without JWT returns 401', () => {
    return request(app.getHttpServer())
      .patch('/companies/c1/verify')
      .expect(401);
  });
});
