import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Notifications (e2e)', () => {
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

  it('GET /notifications without JWT returns 401', () => {
    return request(app.getHttpServer()).get('/notifications').expect(401);
  });

  it('POST /notifications/mark-read/x without JWT returns 401', () => {
    return request(app.getHttpServer())
      .post('/notifications/mark-read/x')
      .expect(401);
  });

  it('POST /notifications/mark-all-read without JWT returns 401', () => {
    return request(app.getHttpServer())
      .post('/notifications/mark-all-read')
      .expect(401);
  });
});
