import { Test, TestingModule } from '@nestjs/testing';
import { TransactionOrigin, TransactionType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { RecurringService } from '../recurring/recurring.service';
import { SummaryService } from './summary.service';

const MONTH = '2026-03';
const USER_ID = 'user-uuid-001';

function makeExpenseTx(
  amountCents: bigint,
  origin: TransactionOrigin,
  extra: Record<string, unknown> = {},
) {
  return {
    type: TransactionType.EXPENSE,
    origin,
    amountCents,
    categoryId: null,
    paymentMethodId: null,
    category: null,
    paymentMethod: null,
    installmentPlan: null,
    ...extra,
  };
}

describe('SummaryService', () => {
  let service: SummaryService;
  let recurringServiceMock: { generateForMonth: jest.Mock };
  let prismaMock: {
    transaction: { findMany: jest.Mock };
    incomeEntry: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    recurringServiceMock = { generateForMonth: jest.fn() };
    prismaMock = {
      transaction: { findMany: jest.fn() },
      incomeEntry: { findMany: jest.fn() },
    };

    recurringServiceMock.generateForMonth.mockResolvedValue({
      generated: 0,
      skipped: 0,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummaryService,
        { provide: RecurringService, useValue: recurringServiceMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<SummaryService>(SummaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getForMonth', () => {
    it('month with no transactions and no income returns all-zero fields', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([]);
      prismaMock.incomeEntry.findMany.mockResolvedValue([]);

      const result = await service.getForMonth(USER_ID, MONTH);

      expect(result.month).toBe(MONTH);
      expect(result.recurringGenerated).toBe(0);
      expect(result.recurringSkipped).toBe(0);
      expect(result.totalGrossCents).toBe(0n);
      expect(result.totalNetIncomeCents).toBe(0n);
      expect(result.totalDeductionCents).toBe(0n);
      expect(result.totalExpenseCents).toBe(0n);
      expect(result.oneTimeCents).toBe(0n);
      expect(result.installmentCents).toBe(0n);
      expect(result.recurringExpenseCents).toBe(0n);
      expect(result.recurringIncomeCents).toBe(0n);
      expect(result.balanceCents).toBe(0n);
      expect(result.byCategory).toEqual([]);
      expect(result.byPaymentMethod).toEqual([]);
    });

    it('ONE_TIME expenses are bucketed in oneTimeCents', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([
        makeExpenseTx(5000n, TransactionOrigin.ONE_TIME),
      ]);
      prismaMock.incomeEntry.findMany.mockResolvedValue([]);

      const result = await service.getForMonth(USER_ID, MONTH);

      expect(result.oneTimeCents).toBe(5000n);
      expect(result.installmentCents).toBe(0n);
      expect(result.recurringExpenseCents).toBe(0n);
      expect(result.totalExpenseCents).toBe(5000n);
    });

    it('INSTALLMENT expenses are bucketed in installmentCents', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([
        makeExpenseTx(10000n, TransactionOrigin.INSTALLMENT),
        makeExpenseTx(2000n, TransactionOrigin.INSTALLMENT),
      ]);
      prismaMock.incomeEntry.findMany.mockResolvedValue([]);

      const result = await service.getForMonth(USER_ID, MONTH);

      expect(result.installmentCents).toBe(12000n);
      expect(result.oneTimeCents).toBe(0n);
      expect(result.recurringExpenseCents).toBe(0n);
      expect(result.totalExpenseCents).toBe(12000n);
    });

    it('RECURRING expenses are bucketed in recurringExpenseCents', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([
        makeExpenseTx(8000n, TransactionOrigin.RECURRING),
      ]);
      prismaMock.incomeEntry.findMany.mockResolvedValue([]);

      const result = await service.getForMonth(USER_ID, MONTH);

      expect(result.recurringExpenseCents).toBe(8000n);
      expect(result.oneTimeCents).toBe(0n);
      expect(result.installmentCents).toBe(0n);
      expect(result.totalExpenseCents).toBe(8000n);
    });

    it('balance = netIncomeCents − totalExpenseCents', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([
        makeExpenseTx(200000n, TransactionOrigin.ONE_TIME),
      ]);
      prismaMock.incomeEntry.findMany.mockResolvedValue([
        {
          grossCents: 600000n,
          netCents: 500000n,
          deductions: [{ amountCents: 60000n }, { amountCents: 40000n }],
        },
      ]);

      const result = await service.getForMonth(USER_ID, MONTH);

      expect(result.totalGrossCents).toBe(600000n);
      expect(result.totalNetIncomeCents).toBe(500000n);
      expect(result.totalDeductionCents).toBe(100000n);
      expect(result.totalExpenseCents).toBe(200000n);
      expect(result.balanceCents).toBe(300000n);
    });

    it('groups expenses by category', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([
        makeExpenseTx(3000n, TransactionOrigin.ONE_TIME, {
          categoryId: 'cat-1',
          category: { name: 'Food' },
        }),
        makeExpenseTx(2000n, TransactionOrigin.ONE_TIME, {
          categoryId: 'cat-1',
          category: { name: 'Food' },
        }),
        makeExpenseTx(5000n, TransactionOrigin.ONE_TIME, {
          categoryId: 'cat-2',
          category: { name: 'Transport' },
        }),
      ]);
      prismaMock.incomeEntry.findMany.mockResolvedValue([]);

      const result = await service.getForMonth(USER_ID, MONTH);

      expect(result.byCategory).toHaveLength(2);

      const food = result.byCategory.find((b) => b.categoryId === 'cat-1');
      expect(food).toBeDefined();
      expect(food!.categoryName).toBe('Food');
      expect(food!.totalCents).toBe(5000n);

      const transport = result.byCategory.find((b) => b.categoryId === 'cat-2');
      expect(transport).toBeDefined();
      expect(transport!.totalCents).toBe(5000n);
    });

    it('groups expenses by payment method', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([
        makeExpenseTx(4000n, TransactionOrigin.ONE_TIME, {
          paymentMethodId: 'pm-1',
          paymentMethod: { name: 'Visa' },
        }),
        makeExpenseTx(1000n, TransactionOrigin.RECURRING, {
          paymentMethodId: 'pm-1',
          paymentMethod: { name: 'Visa' },
        }),
      ]);
      prismaMock.incomeEntry.findMany.mockResolvedValue([]);

      const result = await service.getForMonth(USER_ID, MONTH);

      expect(result.byPaymentMethod).toHaveLength(1);
      expect(result.byPaymentMethod[0].paymentMethodId).toBe('pm-1');
      expect(result.byPaymentMethod[0].totalCents).toBe(5000n);
    });

    it('RECURRING INCOME transactions are included in totalNetIncomeCents and balanceCents', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([
        {
          type: TransactionType.INCOME,
          origin: TransactionOrigin.RECURRING,
          amountCents: 150000n,
          categoryId: null,
          paymentMethodId: null,
          category: null,
          paymentMethod: null,
          installmentPlan: null,
        },
        makeExpenseTx(50000n, TransactionOrigin.ONE_TIME),
      ]);
      prismaMock.incomeEntry.findMany.mockResolvedValue([]);

      const result = await service.getForMonth(USER_ID, MONTH);

      expect(result.recurringIncomeCents).toBe(150000n);
      expect(result.totalNetIncomeCents).toBe(150000n);
      expect(result.totalExpenseCents).toBe(50000n);
      expect(result.balanceCents).toBe(100000n);
    });

    it('RECURRING INCOME is combined with manual income entries netCents in totalNetIncomeCents', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([
        {
          type: TransactionType.INCOME,
          origin: TransactionOrigin.RECURRING,
          amountCents: 200000n,
          categoryId: null,
          paymentMethodId: null,
          category: null,
          paymentMethod: null,
          installmentPlan: null,
        },
      ]);
      prismaMock.incomeEntry.findMany.mockResolvedValue([
        {
          grossCents: 600000n,
          netCents: 500000n,
          deductions: [{ amountCents: 100000n }],
        },
      ]);

      const result = await service.getForMonth(USER_ID, MONTH);

      expect(result.recurringIncomeCents).toBe(200000n);
      expect(result.totalNetIncomeCents).toBe(700000n); // 500000 + 200000
      expect(result.totalGrossCents).toBe(600000n);
      expect(result.balanceCents).toBe(700000n);
    });

    it('INCOME-type transactions are not counted in expense totals', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([
        {
          type: TransactionType.INCOME,
          origin: TransactionOrigin.INCOME,
          amountCents: 100000n,
          categoryId: null,
          paymentMethodId: null,
          category: null,
          paymentMethod: null,
          installmentPlan: null,
        },
        makeExpenseTx(20000n, TransactionOrigin.ONE_TIME),
      ]);
      prismaMock.incomeEntry.findMany.mockResolvedValue([]);

      const result = await service.getForMonth(USER_ID, MONTH);

      expect(result.totalExpenseCents).toBe(20000n);
      expect(result.byCategory).toHaveLength(0);
    });

    it('triggers recurring generation and surfaces generated/skipped counts', async () => {
      recurringServiceMock.generateForMonth.mockResolvedValue({
        generated: 3,
        skipped: 1,
      });
      prismaMock.transaction.findMany.mockResolvedValue([]);
      prismaMock.incomeEntry.findMany.mockResolvedValue([]);

      const result = await service.getForMonth(USER_ID, MONTH);

      expect(recurringServiceMock.generateForMonth).toHaveBeenCalledWith(
        USER_ID,
        MONTH,
      );
      expect(result.recurringGenerated).toBe(3);
      expect(result.recurringSkipped).toBe(1);
    });

    it('aggregates multiple income entries in the same month', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([]);
      prismaMock.incomeEntry.findMany.mockResolvedValue([
        {
          grossCents: 500000n,
          netCents: 430000n,
          deductions: [{ amountCents: 70000n }],
        },
        {
          grossCents: 200000n,
          netCents: 180000n,
          deductions: [{ amountCents: 20000n }],
        },
      ]);

      const result = await service.getForMonth(USER_ID, MONTH);

      expect(result.totalGrossCents).toBe(700000n);
      expect(result.totalDeductionCents).toBe(90000n);
      expect(result.totalNetIncomeCents).toBe(610000n);
      expect(result.incomeEntries).toHaveLength(2);
    });
  });
});
