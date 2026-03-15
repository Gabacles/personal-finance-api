import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import { RecurringService } from '../recurring/recurring.service';
import { PaymentMethodsRepository } from './payment-methods.repository';
import { PaymentMethodsService } from './payment-methods.service';

const mockPaymentMethod = {
  id: 'pm-uuid',
  userId: 'user-uuid',
  name: 'Nubank',
  type: PaymentMethodType.CREDIT_CARD,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  creditCard: {
    id: 'cc-uuid',
    paymentMethodId: 'pm-uuid',
    closingDay: 20,
    dueDay: 27,
    creditLimitCents: null,
  },
};

const mockRepository = {
  findAllByUser: jest.fn(),
  findById: jest.fn(),
};

const mockPrisma = {
  $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      paymentMethod: {
        create: jest.fn().mockResolvedValue(mockPaymentMethod),
      },
    }),
  ),
  transaction: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
};

const mockRecurringService = {
  generateForMonth: jest.fn(),
};

describe('PaymentMethodsService', () => {
  let service: PaymentMethodsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodsService,
        { provide: PaymentMethodsRepository, useValue: mockRepository },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RecurringService, useValue: mockRecurringService },
      ],
    }).compile();

    service = module.get<PaymentMethodsService>(PaymentMethodsService);
    jest.clearAllMocks();
    mockRecurringService.generateForMonth.mockResolvedValue({ generated: 0, skipped: 0 });
  });

  describe('create', () => {
    it('throws CREDIT_CARD_DETAILS_REQUIRED when type is CREDIT_CARD but no creditCard provided', async () => {
      await expect(
        service.create('user-uuid', {
          name: 'Test',
          type: PaymentMethodType.CREDIT_CARD,
          creditCard: undefined,
        }),
      ).rejects.toThrow(BusinessRuleException);
    });

    it('creates payment method with credit card details using $transaction', async () => {
      const result = await service.create('user-uuid', {
        name: 'Nubank',
        type: PaymentMethodType.CREDIT_CARD,
        creditCard: { closingDay: 20, dueDay: 27 },
      });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.creditCard?.closingDay).toBe(20);
    });
  });

  describe('findAll', () => {
    it('delegates to repository with userId and optional type filter', async () => {
      mockRepository.findAllByUser.mockResolvedValue([mockPaymentMethod]);

      const result = await service.findAll('user-uuid', PaymentMethodType.CREDIT_CARD);

      expect(mockRepository.findAllByUser).toHaveBeenCalledWith(
        'user-uuid',
        PaymentMethodType.CREDIT_CARD,
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('returns payment method when found', async () => {
      mockRepository.findById.mockResolvedValue(mockPaymentMethod);

      const result = await service.findById('pm-uuid', 'user-uuid');

      expect(result.id).toBe('pm-uuid');
    });

    it('throws EntityNotFoundException when not found or wrong owner', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('bad-id', 'user-uuid')).rejects.toThrow(
        EntityNotFoundException,
      );
    });
  });

  describe('getStatement', () => {
    it('returns billed total plus committed and available limit for credit cards', async () => {
      mockRepository.findById.mockResolvedValue({
        ...mockPaymentMethod,
        creditCard: {
          ...mockPaymentMethod.creditCard,
          creditLimitCents: BigInt(1000000),
        },
      });
      mockPrisma.transaction.findMany.mockResolvedValue([
        {
          id: 'txn-current',
          amountCents: BigInt(50000),
          transactionDate: new Date('2026-03-10'),
          category: null,
          paymentMethod: mockPaymentMethod,
          installmentPlan: { id: 'plan-1' },
        },
      ]);
      mockPrisma.transaction.aggregate.mockResolvedValue({
        _sum: {
          amountCents: BigInt(500000),
        },
      });

      const result = await service.getStatement('pm-uuid', 'user-uuid', '2026-03');

      expect(mockRecurringService.generateForMonth).toHaveBeenCalledWith(
        'user-uuid',
        '2026-03',
      );
      expect(mockPrisma.transaction.aggregate).toHaveBeenCalledWith({
        where: {
          paymentMethodId: 'pm-uuid',
          type: 'EXPENSE',
          referenceMonth: { gte: '2026-03' },
          deletedAt: null,
        },
        _sum: {
          amountCents: true,
        },
      });
      expect(result.totalCents).toBe(BigInt(50000));
      expect(result.committedLimitCents).toBe(BigInt(500000));
      expect(result.availableLimitCents).toBe(BigInt(500000));
    });

    it('returns null available limit when the card has no configured limit', async () => {
      mockRepository.findById.mockResolvedValue(mockPaymentMethod);
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.transaction.aggregate.mockResolvedValue({
        _sum: {
          amountCents: BigInt(250000),
        },
      });

      const result = await service.getStatement('pm-uuid', 'user-uuid', '2026-03');

      expect(result.committedLimitCents).toBe(BigInt(250000));
      expect(result.availableLimitCents).toBeNull();
    });
  });
});
