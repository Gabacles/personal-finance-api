import { Test, TestingModule } from '@nestjs/testing';
import { EmploymentType, TransactionType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { TaxCalculatorService } from '../income/tax-calculator.service';
import { RecurringService } from '../recurring/recurring.service';
import { UsersService } from '../users/users.service';
import { DashboardService } from './dashboard.service';
import { SummaryService } from './summary.service';

const USER_ID = 'user-uuid-001';
const MONTH = '2026-03';

function makeSummary(month: string) {
  return {
    month,
    recurringGenerated: 0,
    recurringSkipped: 0,
    totalGrossCents: 0n,
    totalNetIncomeCents: 0n,
    totalDeductionCents: 0n,
    totalExpenseCents: 0n,
    oneTimeCents: 0n,
    installmentCents: 0n,
    recurringExpenseCents: 0n,
    recurringIncomeCents: 0n,
    balanceCents: 0n,
    byCategory: [],
    byPaymentMethod: [],
    transactions: [],
    incomeEntries: [],
  };
}

function makeRecurringIncomeTemplate(partial: Record<string, unknown> = {}) {
  return {
    id: 'rt-income-1',
    userId: USER_ID,
    description: 'Salary',
    amountCents: 500000n,
    type: TransactionType.INCOME,
    startMonth: '2026-01',
    endMonth: null,
    dayOfMonth: null,
    categoryId: null,
    paymentMethodId: null,
    notes: null,
    isActive: true,
    applyTaxDeductions: true,
    dependents: 1,
    createdAt: new Date('2026-03-01T00:00:00Z'),
    updatedAt: new Date('2026-03-01T00:00:00Z'),
    deletedAt: null,
    ...partial,
  };
}

describe('DashboardService', () => {
  let service: DashboardService;

  let summaryServiceMock: { getForMonth: jest.Mock };
  let recurringServiceMock: { findActiveForMonth: jest.Mock };
  let prismaMock: {
    transaction: { findMany: jest.Mock };
    incomeEntry: { findMany: jest.Mock };
  };
  let taxCalculatorServiceMock: { computeCLT: jest.Mock };
  let usersServiceMock: { findById: jest.Mock };

  beforeEach(async () => {
    summaryServiceMock = { getForMonth: jest.fn() };
    recurringServiceMock = { findActiveForMonth: jest.fn() };
    prismaMock = {
      transaction: { findMany: jest.fn() },
      incomeEntry: { findMany: jest.fn() },
    };
    taxCalculatorServiceMock = { computeCLT: jest.fn() };
    usersServiceMock = { findById: jest.fn() };

    summaryServiceMock.getForMonth.mockResolvedValue(makeSummary(MONTH));
    prismaMock.transaction.findMany.mockResolvedValue([]);
    prismaMock.incomeEntry.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: SummaryService, useValue: summaryServiceMock },
        { provide: RecurringService, useValue: recurringServiceMock },
        { provide: PrismaService, useValue: prismaMock },
        { provide: TaxCalculatorService, useValue: taxCalculatorServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('projects recurring income as net for CLT templates with applyTaxDeductions=true', async () => {
    recurringServiceMock.findActiveForMonth.mockResolvedValue([
      makeRecurringIncomeTemplate({ amountCents: 500000n, dependents: 2 }),
    ]);
    usersServiceMock.findById.mockResolvedValue({ employmentType: EmploymentType.CLT });
    taxCalculatorServiceMock.computeCLT.mockResolvedValue({ netCents: 401234n });

    const result = await service.get(USER_ID, MONTH, 1);

    expect(usersServiceMock.findById).toHaveBeenCalledWith(USER_ID);
    expect(taxCalculatorServiceMock.computeCLT).toHaveBeenCalledWith(
      500000n,
      2026,
      2,
    );
    expect(result.projections[0].breakdown.recurringIncomeCents).toBe(401234n);
    expect(result.projections[0].projectedIncomeCents).toBe(401234n);
  });

  it('keeps recurring income as gross for non-CLT users even when applyTaxDeductions=true', async () => {
    recurringServiceMock.findActiveForMonth.mockResolvedValue([
      makeRecurringIncomeTemplate({ amountCents: 500000n, dependents: 2 }),
    ]);
    usersServiceMock.findById.mockResolvedValue({ employmentType: EmploymentType.PJ });

    const result = await service.get(USER_ID, MONTH, 1);

    expect(usersServiceMock.findById).toHaveBeenCalledWith(USER_ID);
    expect(taxCalculatorServiceMock.computeCLT).not.toHaveBeenCalled();
    expect(result.projections[0].breakdown.recurringIncomeCents).toBe(500000n);
  });

  it('does not query user or tax table when no recurring income template needs deductions', async () => {
    recurringServiceMock.findActiveForMonth.mockResolvedValue([
      makeRecurringIncomeTemplate({
        amountCents: 500000n,
        applyTaxDeductions: false,
      }),
    ]);

    const result = await service.get(USER_ID, MONTH, 1);

    expect(usersServiceMock.findById).not.toHaveBeenCalled();
    expect(taxCalculatorServiceMock.computeCLT).not.toHaveBeenCalled();
    expect(result.projections[0].breakdown.recurringIncomeCents).toBe(500000n);
  });
});
