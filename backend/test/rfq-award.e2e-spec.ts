import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { OtpDeliveryService } from '../src/auth/otp-delivery.service';

/**
 * RFQ award happy-path E2E (requires DATABASE_URL + Postgres).
 * Uses OtpDeliveryService override to capture OTP (no SMTP/Twilio).
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
    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('info');
    } else {
      expect(res.body).toMatchObject({ statusCode: 503, path: '/health' });
    }
  });
});

const describeFull = process.env.DATABASE_URL ? describe : describe.skip;

describeFull('RFQ award full lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  const otpByEmail: Record<string, string> = {};

  jest.setTimeout(120_000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(OtpDeliveryService)
      .useValue({
        sendRegistrationOtp: async (
          email: string,
          _phone: string | undefined,
          code: string,
        ) => {
          otpByEmail[email] = code;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('register → verify → RFQ → bid → award → PO → supplier PROCESSING → contractor notification', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const contractorEmail = `e2e-co-${suffix}@example.com`;
    const supplierEmail = `e2e-sup-${suffix}@example.com`;
    const password = 'E2eTestPass123!';

    const http = () => request(app.getHttpServer());

    const regCo = await http()
      .post('/auth/register')
      .send({
        email: contractorEmail,
        password,
        phone: `+9665${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`,
        fullName: 'E2E Contractor',
        companyName: `E2E Contractor Co ${suffix}`,
        role: 'contractor',
        crNumber: 'CR-E2E-1',
        taxId: 'TAX-E2E-1',
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const regSup = await http()
      .post('/auth/register')
      .send({
        email: supplierEmail,
        password,
        phone: `+9665${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`,
        fullName: 'E2E Supplier',
        companyName: `E2E Supplier Co ${suffix}`,
        role: 'supplier',
        crNumber: 'CR-E2E-2',
        taxId: 'TAX-E2E-2',
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const otpCo = otpByEmail[contractorEmail];
    const otpSup = otpByEmail[supplierEmail];
    expect(otpCo).toMatch(/^\d{6}$/);
    expect(otpSup).toMatch(/^\d{6}$/);

    const verifyCo = await http()
      .post('/auth/verify-otp')
      .send({ userId: regCo.body.userId, otp: otpCo })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const verifySup = await http()
      .post('/auth/verify-otp')
      .send({ userId: regSup.body.userId, otp: otpSup })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const tokenCo = verifyCo.body.access_token as string;
    const tokenSup = verifySup.body.access_token as string;
    const contractorUser = verifyCo.body.user;
    const supplierUser = verifySup.body.user;
    const supplierCompanyId = supplierUser.company_id as string;

    const projectRes = await http()
      .post('/projects')
      .set('Authorization', `Bearer ${tokenCo}`)
      .send({ name: `E2E Project ${suffix}` })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const projectId = projectRes.body.id as string;

    const rfqRes = await http()
      .post('/rfqs')
      .set('Authorization', `Bearer ${tokenCo}`)
      .send({
        project: { connect: { id: projectId } },
        created_user: { connect: { id: contractorUser.id } },
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const rfqId = rfqRes.body.id as string;

    const itemRes = await http()
      .post('/rfqs/items')
      .set('Authorization', `Bearer ${tokenCo}`)
      .send({
        rfq: { connect: { id: rfqId } },
        product_name: 'Cement',
        quantity: 10,
        unit: 'bags',
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const rfqItemId = itemRes.body.id as string;

    const bidRes = await http()
      .post(`/rfqs/${rfqId}/bids`)
      .set('Authorization', `Bearer ${tokenSup}`)
      .send({
        supplier: { connect: { id: supplierCompanyId } },
        rfq: { connect: { id: rfqId } },
        total_price: 1000,
        items: {
          create: [
            {
              rfq_item: { connect: { id: rfqItemId } },
              unit_price: 100,
            },
          ],
        },
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const bidId = bidRes.body.id as string;

    const awardRes = await http()
      .patch(`/rfqs/${rfqId}/award/${bidId}`)
      .set('Authorization', `Bearer ${tokenCo}`)
      .expect(200);

    const po = awardRes.body;
    expect(po.supplier_id).toBe(supplierCompanyId);
    const poId = po.id as string;

    await http()
      .patch(`/purchase-orders/${poId}/status`)
      .set('Authorization', `Bearer ${tokenSup}`)
      .send({ status: 'PROCESSING' })
      .expect(200);

    const notifs = await http()
      .get('/notifications')
      .set('Authorization', `Bearer ${tokenCo}`)
      .expect(200);

    const list = notifs.body as Array<{ type: string }>;
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((n) => n.type === 'order_status')).toBe(true);
  });
});
