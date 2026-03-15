import { Test, TestingModule } from '@nestjs/testing';
import { EmploymentType, PaymentMethodType, TransactionType } from '@prisma/client';
import { EntityNotFoundException, BusinessRuleException } from '../../shared/exceptions/domain.exceptions';
import { CategoriesService } from '../categories/categories.service';
import { PaymentMethodsRepository } from '../payment-methods/payment-methods.repository';
import { TransactionsService } from '../transactions/transactions.service';
import { TaxCalculatorService } from '../income/tax-calculator.service';
import { UsersService } from '../users/users.service';
import { RecurringRepository } from './recurring.repository';
import { RecurringService } from './recurring.service';

const mockPaymentMethod = (type: PaymentMethodType, closingDay = 10) => ({
  id: 'pm-1',
  userId: 'user-1',
  type,
  creditCard: type === PaymentMethodType.CREDIT_CARD ? { closingDay, dueDay: 17 } : null,
});

const mockTemplate = (overrides: Partial<any> = {}) => ({
  id: 'rt-1',
  userId: 'user-1',
  description: 'Netflix',
  amountCents: BigInt(4990),
  type: TransactionType.EXPENSE,
  startMonth: '2026-01',
  endMonth: null,
  isActive: true,
  dayOfMonth: null,
  categoryId: null,
  paymentMethodId: null,
  applyTaxDeductions: false,
  dependents: 0,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

describe('RecurringService', () => {
  let service: RecurringService;
  let recurringRepo: jest.Mocked<RecurringRepository>;
  let paymentMethodsRepo: jest.Mocked<PaymentMethodsRepository>;
  let categoriesService: jest.Mocked<CategoriesService>;
  let transactionsService: jest.Mocked<TransactionsService>;
  let taxCalculatorService: jest.Mocked<TaxCalculatorService>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringService,
        {
          provide: RecurringRepository,
          useValue: {
            create: jest.fn(),
            findAllByUser: jest.fn(),
            findById: jest.fn(),
            findActiveForMonth: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: PaymentMethodsRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: CategoriesService,
          useValue: {
            validateOwnershipAndType: jest.fn(),
          },
        },
        {
          provide: TransactionsService,
          useValue: {
            createFromRecurring: jest.fn(),
            softDeleteByRecurringTransactionId: jest.fn(),
          },
        },
        {
          provide: TaxCalculatorService,
          useValue: {
            computeCLT: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(RecurringService);
    recurringRepo = module.get(RecurringRepository);
    paymentMethodsRepo = module.get(PaymentMethodsRepository);
    categoriesService = module.get(CategoriesService);
    transactionsService = module.get(TransactionsService);
    taxCalculatorService = module.get(TaxCalculatorService);
    usersService = module.get(UsersService);
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------

  describe('create', () => {
    it('throws INCOME_WITH_PAYMENT_METHOD when INCOME type has a paymentMethodId', async () => {
      await expect(
        service.create('user-1', {
          description: 'Salary',
          amountCents: 500000,
          type: TransactionType.INCOME,
          startMonth: '2026-01',
          paymentMethodId: 'pm-1',
        }),
      ).rejects.toThrow(BusinessRuleException);
    });

    it('throws EntityNotFoundException when paymentMethodId not found', async () => {
      paymentMethodsRepo.findById.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          description: 'Netflix',
          amountCents: 4990,
          type: TransactionType.EXPENSE,
          startMonth: '2026-01',
          paymentMethodId: 'pm-missing',
        }),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('throws CREDIT_CARD_DAY_OF_MONTH_REQUIRED when CREDIT_CARD PM without dayOfMonth', async () => {
      paymentMethodsRepo.findById.mockResolvedValue(mockPaymentMethod(PaymentMethodType.CREDIT_CARD) as any);

      await expect(
        service.create('user-1', {
          description: 'Netflix',
          amountCents: 4990,
          type: TransactionType.EXPENSE,
          startMonth: '2026-01',
          paymentMethodId: 'pm-1',
          // dayOfMonth omitted
        }),
      ).rejects.toThrow(BusinessRuleException);
    });

    it('throws END_MONTH_BEFORE_START_MONTH when endMonth < startMonth', async () => {
      await expect(
        service.create('user-1', {
          description: 'Netflix',
          amountCents: 4990,
          type: TransactionType.EXPENSE,
          startMonth: '2026-06',
          endMonth: '2026-03',
        }),
      ).rejects.toThrow(BusinessRuleException);
    });

    it('creates a simple EXPENSE template without payment method', async () => {
      const expected = mockTemplate();
      recurringRepo.create.mockResolvedValue(expected as any);

      const result = await service.create('user-1', {
        description: 'Netflix',
        amountCents: 4990,
        type: TransactionType.EXPENSE,
        startMonth: '2026-01',
      });

      expect(recurringRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          description: 'Netflix',
          amountCents: BigInt(4990),
          type: TransactionType.EXPENSE,
        }),
      );
      expect(result).toBe(expected);
    });

    it('creates an INCOME template (no payment method)', async () => {
      const expected = mockTemplate({ type: TransactionType.INCOME, amountCents: BigInt(500000) });
      recurringRepo.create.mockResolvedValue(expected as any);

      const result = await service.create('user-1', {
        description: 'Salary',
        amountCents: 500000,
        type: TransactionType.INCOME,
        startMonth: '2026-01',
      });

      expect(result).toBe(expected);
    });

    it('throws TAX_DEDUCTIONS_ONLY_FOR_INCOME when applyTaxDeductions=true for EXPENSE', async () => {
      await expect(
        service.create('user-1', {
          description: 'Netflix',
          amountCents: 4990,
          type: TransactionType.EXPENSE,
          startMonth: '2026-01',
          applyTaxDeductions: true,
        }),
      ).rejects.toThrow(BusinessRuleException);
    });

    it('creates INCOME template with applyTaxDeductions=true', async () => {
      const expected = mockTemplate({
        type: TransactionType.INCOME,
        amountCents: BigInt(800000),
        applyTaxDeductions: true,
        dependents: 1,
      });
      recurringRepo.create.mockResolvedValue(expected as any);

      const result = await service.create('user-1', {
        description: 'Salary',
        amountCents: 800000,
        type: TransactionType.INCOME,
        startMonth: '2026-01',
        applyTaxDeductions: true,
        dependents: 1,
      });

      expect(recurringRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ applyTaxDeductions: true, dependents: 1 }),
      );
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // generateForMonth
  // ---------------------------------------------------------------------------

  describe('generateForMonth', () => {
    it('generates transactions for active templates and returns counts', async () => {
      const template = mockTemplate();
      recurringRepo.findActiveForMonth.mockResolvedValue([template] as any);
      transactionsService.createFromRecurring.mockResolvedValue({ id: 'tx-1' } as any);

      const result = await service.generateForMonth('user-1', '2026-03');

      expect(recurringRepo.findActiveForMonth).toHaveBeenCalledWith('user-1', '2026-03');
      expect(transactionsService.createFromRecurring).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          recurringTransactionId: 'rt-1',
          referenceMonth: '2026-03',
          amountCents: BigInt(4990),
        }),
      );
      expect(result).toEqual({ generated: 1, skipped: 0 });
    });

    it('applies CLT tax deductions when applyTaxDeductions=true and user is CLT', async () => {
      const grossCents = BigInt(800000);
      const netCents = BigInt(650000);
      const template = mockTemplate({
        type: TransactionType.INCOME,
        amountCents: grossCents,
        applyTaxDeductions: true,
        dependents: 0,
      });
      recurringRepo.findActiveForMonth.mockResolvedValue([template] as any);
      usersService.findById.mockResolvedValue({ id: 'user-1', employmentType: EmploymentType.CLT } as any);
      taxCalculatorService.computeCLT.mockResolvedValue({ netCents } as any);
      transactionsService.createFromRecurring.mockResolvedValue({ id: 'tx-1' } as any);

      await service.generateForMonth('user-1', '2026-03');

      expect(taxCalculatorService.computeCLT).toHaveBeenCalledWith(grossCents, 2026, 0);
      expect(transactionsService.createFromRecurring).toHaveBeenCalledWith(
        expect.objectContaining({ amountCents: netCents }),
      );
    });

    it('does not apply deductions when user is PJ even if applyTaxDeductions=true', async () => {
      const grossCents = BigInt(800000);
      const template = mockTemplate({
        type: TransactionType.INCOME,
        amountCents: grossCents,
        applyTaxDeductions: true,
        dependents: 0,
      });
      recurringRepo.findActiveForMonth.mockResolvedValue([template] as any);
      usersService.findById.mockResolvedValue({ id: 'user-1', employmentType: EmploymentType.PJ } as any);
      transactionsService.createFromRecurring.mockResolvedValue({ id: 'tx-1' } as any);

      await service.generateForMonth('user-1', '2026-03');

      expect(taxCalculatorService.computeCLT).not.toHaveBeenCalled();
      expect(transactionsService.createFromRecurring).toHaveBeenCalledWith(
        expect.objectContaining({ amountCents: grossCents }),
      );
    });

    it('fetches user only once for multiple templates with applyTaxDeductions=true', async () => {
      const netCents = BigInt(650000);
      const templates = [
        mockTemplate({ id: 'rt-1', type: TransactionType.INCOME, amountCents: BigInt(800000), applyTaxDeductions: true }),
        mockTemplate({ id: 'rt-2', type: TransactionType.INCOME, amountCents: BigInt(800000), applyTaxDeductions: true }),
      ];
      recurringRepo.findActiveForMonth.mockResolvedValue(templates as any);
      usersService.findById.mockResolvedValue({ id: 'user-1', employmentType: EmploymentType.CLT } as any);
      taxCalculatorService.computeCLT.mockResolvedValue({ netCents } as any);
      transactionsService.createFromRecurring.mockResolvedValue({ id: 'tx-1' } as any);

      await service.generateForMonth('user-1', '2026-03');

      expect(usersService.findById).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------

  describe('findAll', () => {
    it('returns effective net amount and tax breakdown for CLT INCOME templates with applyTaxDeductions=true', async () => {
      const grossCents = BigInt(800000);
      const netCents = BigInt(650000);
      recurringRepo.findAllByUser.mockResolvedValue({
        items: [
          mockTemplate({
            type: TransactionType.INCOME,
            amountCents: grossCents,
            applyTaxDeductions: true,
            dependents: 1,
          }),
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      } as any);
      usersService.findById.mockResolvedValue({ id: 'user-1', employmentType: EmploymentType.CLT } as any);
      taxCalculatorService.computeCLT.mockResolvedValue({
        grossCents,
        inssCents: 80000n,
        irrfCents: 70000n,
        dependentAllowanceTotalCents: 24274n,
        netCents,
        inssSlices: [],
        irrfDetail: {
          taxableBasisCents: 0n,
          rateBps: 0,
          deductionAppliedCents: 0n,
          monthlyReductionCents: 0n,
          totalCents: 0n,
        },
      } as any);

      const result = await service.findAll(
        'user-1',
        { type: TransactionType.INCOME },
        { page: 1, limit: 20 },
      );

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].amountCents).toBe(netCents);
      expect(result.items[0].grossAmountCents).toBe(grossCents);
      expect(result.items[0].netAmountCents).toBe(netCents);
      expect(result.items[0].deductionCents).toBe(grossCents - netCents);
      expect(result.items[0].taxBreakdown).toBeDefined();
    });

    it('keeps gross amount for PJ users even when applyTaxDeductions=true', async () => {
      const grossCents = BigInt(800000);
      recurringRepo.findAllByUser.mockResolvedValue({
        items: [
          mockTemplate({
            type: TransactionType.INCOME,
            amountCents: grossCents,
            applyTaxDeductions: true,
          }),
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      } as any);
      usersService.findById.mockResolvedValue({ id: 'user-1', employmentType: EmploymentType.PJ } as any);

      const result = await service.findAll(
        'user-1',
        { type: TransactionType.INCOME },
        { page: 1, limit: 20 },
      );

      expect(result.items[0].amountCents).toBe(grossCents);
      expect(result.items[0].grossAmountCents).toBe(grossCents);
      expect(result.items[0].netAmountCents).toBe(grossCents);
      expect(result.items[0].deductionCents).toBe(0n);
      expect(result.items[0].taxBreakdown).toBeNull();
      expect(taxCalculatorService.computeCLT).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------

  describe('findById', () => {
    it('throws EntityNotFoundException when not found', async () => {
      recurringRepo.findById.mockResolvedValue(null);

      await expect(service.findById('rt-missing', 'user-1')).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('returns the template when found', async () => {
      const tpl = mockTemplate();
      recurringRepo.findById.mockResolvedValue(tpl as any);

      const result = await service.findById('rt-1', 'user-1');
      expect(result).toMatchObject(tpl);
    });
  });

  // ---------------------------------------------------------------------------
  // activate / deactivate
  // ---------------------------------------------------------------------------

  describe('activate', () => {
    it('throws when template not found', async () => {
      recurringRepo.findById.mockResolvedValue(null);
      await expect(service.activate('rt-missing', 'user-1')).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('calls update with isActive: true', async () => {
      const tpl = mockTemplate({ isActive: false });
      recurringRepo.findById.mockResolvedValue(tpl as any);
      recurringRepo.update.mockResolvedValue({ ...tpl, isActive: true } as any);

      await service.activate('rt-1', 'user-1');
      expect(recurringRepo.update).toHaveBeenCalledWith('rt-1', { isActive: true });
    });
  });

  describe('deactivate', () => {
    it('calls update with isActive: false', async () => {
      const tpl = mockTemplate({ isActive: true });
      recurringRepo.findById.mockResolvedValue(tpl as any);
      recurringRepo.update.mockResolvedValue({ ...tpl, isActive: false } as any);

      await service.deactivate('rt-1', 'user-1');
      expect(recurringRepo.update).toHaveBeenCalledWith('rt-1', { isActive: false });
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------

  describe('remove', () => {
    it('throws when template not found', async () => {
      recurringRepo.findById.mockResolvedValue(null);
      await expect(service.remove('rt-missing', 'user-1')).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('calls softDelete', async () => {
      recurringRepo.findById.mockResolvedValue(mockTemplate() as any);

      await service.remove('rt-1', 'user-1');
      expect(recurringRepo.softDelete).toHaveBeenCalledWith('rt-1');
    });
  });
});
