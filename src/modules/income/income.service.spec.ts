import { Test, TestingModule } from '@nestjs/testing';
import { EmploymentType } from '@prisma/client';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import { PrismaService } from '../../shared/database/prisma.service';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TaxCalculatorService, TaxBreakdown } from './tax-calculator.service';
import { IncomeDeductionRepository } from './income-deduction.repository';
import { IncomeRepository } from './income.repository';
import { IncomeService } from './income.service';

const MOCK_USER_CLT = {
  id: 'user-1',
  name: 'Test',
  email: 'test@test.com',
  employmentType: EmploymentType.CLT,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const MOCK_USER_PJ = { ...MOCK_USER_CLT, employmentType: EmploymentType.PJ };

const MOCK_TAX_BREAKDOWN: TaxBreakdown = {
  grossCents: 700_000n,
  inssCents: 49_060n,
  irrfCents: 19_161n,
  dependentAllowanceTotalCents: 0n,
  netCents: 431_779n,
  inssSlices: [],
  irrfDetail: {
    taxableBasisCents: 650_940n,
    rateBps: 1500,
    deductionAppliedCents: 48_480n,
    totalCents: 19_161n,
  },
};

const mockEntry = (overrides: Partial<any> = {}) => ({
  id: 'entry-1',
  userId: 'user-1',
  referenceMonth: '2026-03',
  grossCents: 700_000n,
  netCents: 431_779n,
  employmentType: EmploymentType.CLT,
  description: 'Salário',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  deductions: [
    { id: 'd-1', incomeEntryId: 'entry-1', description: 'INSS', amountCents: 49_060n, isAutomatic: true, deductionType: 'INSS', createdAt: new Date() },
    { id: 'd-2', incomeEntryId: 'entry-1', description: 'IRRF', amountCents: 19_161n, isAutomatic: true, deductionType: 'IRRF', createdAt: new Date() },
  ],
  ...overrides,
});

describe('IncomeService', () => {
  let service: IncomeService;
  let incomeRepo: jest.Mocked<IncomeRepository>;
  let deductionRepo: jest.Mocked<IncomeDeductionRepository>;
  let taxService: jest.Mocked<TaxCalculatorService>;
  let usersService: jest.Mocked<UsersService>;
  let transactionsService: jest.Mocked<TransactionsService>;
  let prisma: { $transaction: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((cb: (tx: any) => Promise<any>) =>
        cb({
          transaction: { updateMany: jest.fn() },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomeService,
        { provide: IncomeRepository, useValue: { create: jest.fn(), findAllByUser: jest.fn(), findByMonth: jest.fn(), findById: jest.fn(), update: jest.fn() } },
        { provide: IncomeDeductionRepository, useValue: { createMany: jest.fn(), deleteByEntry: jest.fn(), deleteAutoByEntry: jest.fn(), findByEntry: jest.fn() } },
        { provide: TaxCalculatorService, useValue: { computeCLT: jest.fn() } },
        { provide: UsersService, useValue: { findById: jest.fn() } },
        { provide: TransactionsService, useValue: { createIncomeTransaction: jest.fn() } },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(IncomeService);
    incomeRepo = module.get(IncomeRepository);
    deductionRepo = module.get(IncomeDeductionRepository);
    taxService = module.get(TaxCalculatorService);
    usersService = module.get(UsersService);
    transactionsService = module.get(TransactionsService);
  });

  // ---------------------------------------------------------------------------
  // register
  // ---------------------------------------------------------------------------

  describe('register', () => {
    beforeEach(() => {
      incomeRepo.findByMonth.mockResolvedValue(null); // no existing entry
      incomeRepo.create.mockResolvedValue(mockEntry() as any);
      incomeRepo.findById.mockResolvedValue(mockEntry() as any);
      deductionRepo.createMany.mockResolvedValue([]);
      transactionsService.createIncomeTransaction.mockResolvedValue({} as any);
    });

    it('computes CLT auto deductions (INSS + IRRF) and persists them', async () => {
      usersService.findById.mockResolvedValue(MOCK_USER_CLT as any);
      taxService.computeCLT.mockResolvedValue(MOCK_TAX_BREAKDOWN);

      await service.register('user-1', {
        referenceMonth: '2026-03',
        grossCents: 700_000,
      });

      expect(taxService.computeCLT).toHaveBeenCalledWith(700_000n, 2026, 0);
      expect(deductionRepo.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ description: 'INSS', amountCents: 49_060n, isAutomatic: true }),
          expect.objectContaining({ description: 'IRRF', amountCents: 19_161n, isAutomatic: true }),
        ]),
        expect.anything(),
      );
    });

    it('PJ — skips tax calculation, no auto deductions', async () => {
      usersService.findById.mockResolvedValue(MOCK_USER_PJ as any);
      // Net = gross if no deductions
      incomeRepo.create.mockResolvedValue({ ...mockEntry(), netCents: 700_000n } as any);
      incomeRepo.findById.mockResolvedValue({ ...mockEntry(), netCents: 700_000n } as any);

      await service.register('user-1', {
        referenceMonth: '2026-03',
        grossCents: 700_000,
      });

      expect(taxService.computeCLT).not.toHaveBeenCalled();
    });

    it('throws INCOME_ALREADY_REGISTERED when month already has an entry', async () => {
      usersService.findById.mockResolvedValue(MOCK_USER_CLT as any);
      incomeRepo.findByMonth.mockResolvedValue(mockEntry() as any);

      await expect(
        service.register('user-1', {
          referenceMonth: '2026-03',
          grossCents: 700_000,
        }),
      ).rejects.toThrow(BusinessRuleException);
    });

    it('throws NET_INCOME_NOT_POSITIVE when custom deductions exceed gross (PJ)', async () => {
      usersService.findById.mockResolvedValue(MOCK_USER_PJ as any);

      await expect(
        service.register('user-1', {
          referenceMonth: '2026-03',
          grossCents: 100_000,
          customDeductions: [{ description: 'Huge deduction', amountCents: 200_000 }],
        }),
      ).rejects.toThrow(BusinessRuleException);
    });

    it('creates income transaction with net amount', async () => {
      usersService.findById.mockResolvedValue(MOCK_USER_CLT as any);
      taxService.computeCLT.mockResolvedValue(MOCK_TAX_BREAKDOWN);

      await service.register('user-1', {
        referenceMonth: '2026-03',
        grossCents: 700_000,
      });

      expect(transactionsService.createIncomeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ amountCents: 700_000n - 49_060n - 19_161n }),
        expect.anything(),
      );
    });

    it('passes dependents to tax calculator', async () => {
      usersService.findById.mockResolvedValue(MOCK_USER_CLT as any);
      taxService.computeCLT.mockResolvedValue(MOCK_TAX_BREAKDOWN);

      await service.register('user-1', {
        referenceMonth: '2026-03',
        grossCents: 700_000,
        dependents: 2,
      });

      expect(taxService.computeCLT).toHaveBeenCalledWith(700_000n, 2026, 2);
    });
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------

  describe('findById', () => {
    it('throws EntityNotFoundException when not found', async () => {
      incomeRepo.findById.mockResolvedValue(null);
      await expect(service.findById('missing', 'user-1')).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('returns entry when found', async () => {
      const entry = mockEntry();
      incomeRepo.findById.mockResolvedValue(entry as any);
      const result = await service.findById('entry-1', 'user-1');
      expect(result).toBe(entry);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------

  describe('update', () => {
    beforeEach(() => {
      incomeRepo.findById.mockResolvedValue(mockEntry() as any);
      incomeRepo.update.mockResolvedValue({} as any);
      deductionRepo.deleteAutoByEntry.mockResolvedValue();
      deductionRepo.deleteByEntry.mockResolvedValue();
      deductionRepo.createMany.mockResolvedValue([]);
    });

    it('throws EntityNotFoundException when not found', async () => {
      incomeRepo.findById.mockResolvedValue(null);
      await expect(
        service.update('missing', 'user-1', { grossCents: 800_000 }),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('recalculates auto deductions on gross change (CLT)', async () => {
      const updatedBreakdown: TaxBreakdown = { ...MOCK_TAX_BREAKDOWN, grossCents: 800_000n, inssCents: 55_000n, irrfCents: 22_000n, netCents: 723_000n };
      taxService.computeCLT.mockResolvedValue(updatedBreakdown);
      // After update, findById returns updated
      incomeRepo.findById.mockResolvedValueOnce(mockEntry() as any).mockResolvedValueOnce({ ...mockEntry(), grossCents: 800_000n, netCents: 723_000n } as any);

      await service.update('entry-1', 'user-1', { grossCents: 800_000 });

      expect(taxService.computeCLT).toHaveBeenCalledWith(800_000n, 2026, 0);
      expect(deductionRepo.deleteAutoByEntry).toHaveBeenCalledWith('entry-1', expect.anything());
    });

    it('throws NET_INCOME_NOT_POSITIVE when new deductions exceed new gross', async () => {
      const tinyBreakdown: TaxBreakdown = { ...MOCK_TAX_BREAKDOWN, inssCents: 5_000n, irrfCents: 0n, netCents: 95_000n, grossCents: 100_000n };
      taxService.computeCLT.mockResolvedValue(tinyBreakdown);

      await expect(
        service.update('entry-1', 'user-1', {
          grossCents: 100_000,
          customDeductions: [{ description: 'huge', amountCents: 200_000 }],
        }),
      ).rejects.toThrow(BusinessRuleException);
    });
  });
});
