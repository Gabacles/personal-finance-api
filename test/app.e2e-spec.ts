/**
 * End-to-end test suite — critical happy paths across all milestones.
 *
 * Requires a running PostgreSQL instance (docker compose up -d) and
 * a seeded database (npm run db:seed). Tests run sequentially, sharing
 * state (tokens, IDs) via closures. A unique email prevents conflicts
 * with existing rows between runs.
 *
 * Run with: npm run test:e2e
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

// Mirror the BigInt serialization from main.ts
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function (
  this: bigint,
) {
  return Number(this);
};

describe('Personal Finance API (e2e)', () => {
  let app: INestApplication<App>;

  // Shared state across tests (sequential execution)
  let authToken: string;
  let categoryId: string;
  let paymentMethodId: string;
  let creditCardId: string;
  let transactionId: string;
  let incomeId: string;

  const testEmail = `e2e+${Date.now()}@example.com`;
  const testPassword = 'Secure@Password1';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mirror global setup from main.ts
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Auth (M1) ───────────────────────────────────────────────────────────

  describe('Auth', () => {
    it('POST /auth/register — creates a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ name: 'E2E User', email: testEmail, password: testPassword })
        .expect(201);

      expect(res.body.data.email).toBe(testEmail);
    });

    it('POST /auth/login — returns a JWT token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      authToken = res.body.data.accessToken as string;
    });

    it('GET /users/me — returns the authenticated user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.email).toBe(testEmail);
    });

    it('GET /users/me — 401 without token', () => {
      return request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });
  });

  // ─── Categories (M3) ─────────────────────────────────────────────────────

  describe('Categories', () => {
    it('GET /categories — lists seeded system categories', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      categoryId = res.body.data[0].id as string;
    });
  });

  // ─── Payment Methods (M2 + M10-04/05) ────────────────────────────────────

  describe('Payment Methods', () => {
    it('POST /payment-methods — creates a debit card', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Nubank Debit', type: 'DEBIT_CARD' })
        .expect(201);

      expect(res.body.data.name).toBe('Nubank Debit');
      paymentMethodId = res.body.data.id as string;
    });

    it('POST /payment-methods — creates a credit card', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Nubank CC',
          type: 'CREDIT_CARD',
          creditCard: { closingDay: 20, dueDay: 27 },
        })
        .expect(201);

      expect(res.body.data.creditCard).toBeDefined();
      creditCardId = res.body.data.id as string;
    });

    it('GET /payment-methods — lists both payment methods', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /payment-methods/:id — returns a single payment method', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/payment-methods/${paymentMethodId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(paymentMethodId);
    });

    it('PATCH /payment-methods/:id — updates the name (M10-04)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/payment-methods/${paymentMethodId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Debit' })
        .expect(200);

      expect(res.body.data.name).toBe('Updated Debit');
    });
  });

  // ─── Transactions — Direct Expense (M4 + M10-01/02/03) ───────────────────

  describe('Transactions', () => {
    it('POST /transactions — creates a direct expense (M10-01)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Groceries',
          amountCents: 5000,
          transactionDate: '2026-03-07',
          categoryId,
          paymentMethodId,
        })
        .expect(201);

      expect(res.body.data.amountCents).toBe(5000);
      expect(res.body.data.origin).toBe('ONE_TIME');
      transactionId = res.body.data.id as string;
    });

    it('POST /transactions — 422 when using a credit card (M10-01 guard)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Should fail',
          amountCents: 1000,
          transactionDate: '2026-03-07',
          paymentMethodId: creditCardId,
        })
        .expect(422);
    });

    it('GET /transactions — lists transactions including the new expense', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('GET /transactions/:id — returns the direct expense', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(transactionId);
    });

    it('PATCH /transactions/:id — updates description and amount (M10-02)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Groceries (edited)', amountCents: 7500 })
        .expect(200);

      expect(res.body.data.amountCents).toBe(7500);
      expect(res.body.data.description).toBe('Groceries (edited)');
    });

    it('DELETE /transactions/:id — soft-deletes the expense (M10-03)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('GET /transactions/:id — 404 after soft-delete', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  // ─── Income (M8 + M10-06) ────────────────────────────────────────────────

  describe('Income', () => {
    it('GET /income/estimate — returns tax breakdown without auth (M8)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/income/estimate?grossCents=500000')
        .expect(200);

      expect(res.body.data.inssCents).toBeDefined();
      expect(res.body.data.netCents).toBeDefined();
    });

    it('POST /income — registers a monthly income entry', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/income')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          referenceMonth: '2026-03',
          grossCents: 600000,
          description: 'March salary',
        })
        .expect(201);

      expect(res.body.data.grossCents).toBe(600000);
      incomeId = res.body.data.id as string;
    });

    it('GET /income — lists income entries', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/income')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /income/:id — returns the income entry with deductions', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/income/${incomeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(incomeId);
      expect(Array.isArray(res.body.data.deductions)).toBe(true);
    });

    it('PATCH /income/:id — updates gross amount', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/income/${incomeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ grossCents: 650000 })
        .expect(200);

      expect(res.body.data.grossCents).toBe(650000);
    });

    it('DELETE /income/:id — soft-deletes the income entry (M10-06)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/income/${incomeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('GET /income/:id — 404 after soft-delete', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/income/${incomeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  // ─── Reporting (M9) ──────────────────────────────────────────────────────

  describe('Reporting', () => {
    it('GET /summary/:month — returns monthly aggregated summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/summary/2026-03')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.month).toBe('2026-03');
      expect(typeof res.body.data.totalExpenseCents).toBe('number');
      expect(typeof res.body.data.balanceCents).toBe('number');
      expect(Array.isArray(res.body.data.byCategory)).toBe(true);
    });

    it('GET /dashboard — returns current month + projections', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard?month=2026-03&projectionMonths=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.currentMonth).toBeDefined();
      expect(res.body.data.projections).toHaveLength(2);
      expect(res.body.data.projections[0].confidence).toBe('HIGH');
    });

    it('GET /payment-methods/:id/statement — returns PM statement', async () => {
      // creditCardId still exists (only debit was deleted)
      const res = await request(app.getHttpServer())
        .get(`/api/v1/payment-methods/${creditCardId}/statement?month=2026-03`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.referenceMonth).toBe('2026-03');
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
    });
  });

  // ─── User profile (M10-07) ───────────────────────────────────────────────

  describe('User Management', () => {
    it('PATCH /users/me — updates the user name (M10-07)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated E2E User' })
        .expect(200);

      expect(res.body.data.name).toBe('Updated E2E User');
    });
  });

  // ─── Payment Method deletion deferred to end (M10-05) ────────────────────

  describe('Payment Method deletion', () => {
    it('DELETE /payment-methods/:id — soft-deletes a method with no installments (M10-05)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/payment-methods/${paymentMethodId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });
  });
});

