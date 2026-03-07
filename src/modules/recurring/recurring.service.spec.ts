import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodType, TransactionType } from '@prisma/client';
import { EntityNotFoundException, BusinessRuleException } from '../../shared/exceptions/domain.exceptions';
import { CategoriesService } from '../categories/categories.service';
import { PaymentMethodsRepository } from '../payment-methods/payment-methods.repository';
import { TransactionsService } from '../transactions/transactions.service';
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
          },
        },
      ],
    }).compile();

    service = module.get(RecurringService);
    recurringRepo = module.get(RecurringRepository);
    paymentMethodsRepo = module.get(PaymentMethodsRepository);
    categoriesService = module.get(CategoriesService);
    transactionsService = module.get(TransactionsService);
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
        }),
      );
      expect(result).toEqual({ generated: 1, skipped: 0 });
    });

    it('counts skipped (null return = already generated / P2002 hit)', async () => {
      const templates = [mockTemplate({ id: 'rt-1' }), mockTemplate({ id: 'rt-2' })];
      recurringRepo.findActiveForMonth.mockResolvedValue(templates as any);
      // First already exists, second is new
      transactionsService.createFromRecurring
        .mockResolvedValueOnce(null)          // skipped
        .mockResolvedValueOnce({ id: 'tx-2' } as any); // generated

      const result = await service.generateForMonth('user-1', '2026-03');

      expect(result).toEqual({ generated: 1, skipped: 1 });
    });

    it('returns 0 generated when no active templates found', async () => {
      recurringRepo.findActiveForMonth.mockResolvedValue([]);

      const result = await service.generateForMonth('user-1', '2026-03');

      expect(result).toEqual({ generated: 0, skipped: 0 });
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
      expect(result).toBe(tpl);
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
