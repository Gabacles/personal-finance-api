import { Test, TestingModule } from '@nestjs/testing';
import {
  InstallmentStatus,
  PaymentMethodType,
  TransactionOrigin,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import { CategoriesService } from '../categories/categories.service';
import { PaymentMethodsRepository } from '../payment-methods/payment-methods.repository';
import { TransactionsRepository } from '../transactions/transactions.repository';
import { TransactionsService } from '../transactions/transactions.service';
import { InstallmentsRepository } from './installments.repository';
import { InstallmentsService } from './installments.service';

const mockCreditCardPM = {
  id: 'pm-uuid',
  userId: 'user-uuid',
  name: 'Nubank',
  type: PaymentMethodType.CREDIT_CARD,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  creditCard: { id: 'cc-uuid', paymentMethodId: 'pm-uuid', closingDay: 10, dueDay: 17, creditLimitCents: null },
};

const mockDebitPM = {
  ...mockCreditCardPM,
  type: PaymentMethodType.DEBIT_CARD,
  creditCard: null,
};

const mockPlan = {
  id: 'plan-uuid',
  userId: 'user-uuid',
  paymentMethodId: 'pm-uuid',
  categoryId: null,
  description: 'MacBook Pro',
  totalAmountCents: BigInt(600000),
  installmentCount: 3,
  firstReferenceMonth: '2026-03',
  status: InstallmentStatus.ACTIVE,
  purchaseDate: new Date('2026-03-05'),
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  transactions: [
    { id: 'txn-1', referenceMonth: '2026-02', amountCents: BigInt(200000), deletedAt: null, category: null, paymentMethod: null },
    { id: 'txn-2', referenceMonth: '2026-03', amountCents: BigInt(200000), deletedAt: null, category: null, paymentMethod: null },
    { id: 'txn-3', referenceMonth: '2026-04', amountCents: BigInt(200000), deletedAt: null, category: null, paymentMethod: null },
  ],
};

const mockRepo = {
  create: jest.fn(),
  findAllByUser: jest.fn(),
  findById: jest.fn(),
  cancel: jest.fn(),
};

const mockTxnsRepo = {
  findFutureInstallments: jest.fn(),
};

const mockPaymentMethodsRepo = {
  findById: jest.fn(),
};

const mockCategoriesService = {
  validateOwnershipAndType: jest.fn(),
};

const mockTransactionsService = {
  createInstallmentBatch: jest.fn(),
};

const mockPrisma = {
  $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      installmentPlan: { update: jest.fn() },
      transaction: { update: jest.fn() },
    }),
  ),
};

describe('InstallmentsService', () => {
  let service: InstallmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstallmentsService,
        { provide: InstallmentsRepository, useValue: mockRepo },
        { provide: TransactionsRepository, useValue: mockTxnsRepo },
        { provide: PaymentMethodsRepository, useValue: mockPaymentMethodsRepo },
        { provide: CategoriesService, useValue: mockCategoriesService },
        { provide: TransactionsService, useValue: mockTransactionsService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InstallmentsService>(InstallmentsService);
    jest.clearAllMocks();
  });

  const validDto = {
    paymentMethodId: 'pm-uuid',
    description: 'MacBook Pro',
    totalAmountCents: 600000,
    installmentCount: 3,
    purchaseDate: '2026-03-05',
  };

  describe('create', () => {
    it('throws EntityNotFoundException when payment method not found', async () => {
      mockPaymentMethodsRepo.findById.mockResolvedValue(null);

      await expect(service.create('user-uuid', validDto)).rejects.toThrow(EntityNotFoundException);
    });

    it('throws PAYMENT_METHOD_NOT_CREDIT_CARD for non-credit-card payment method', async () => {
      mockPaymentMethodsRepo.findById.mockResolvedValue(mockDebitPM);

      const err = await service.create('user-uuid', validDto).catch((e) => e);
      expect(err).toBeInstanceOf(BusinessRuleException);
      expect(err.code).toBe('PAYMENT_METHOD_NOT_CREDIT_CARD');
    });

    it('throws FUTURE_PURCHASE_DATE when purchaseDate is in the future', async () => {
      mockPaymentMethodsRepo.findById.mockResolvedValue(mockCreditCardPM);

      const err = await service
        .create('user-uuid', { ...validDto, purchaseDate: '2027-01-01' })
        .catch((e) => e);
      expect(err).toBeInstanceOf(BusinessRuleException);
      expect(err.code).toBe('FUTURE_PURCHASE_DATE');
    });

    it('creates plan and N installment transactions inside $transaction', async () => {
      mockPaymentMethodsRepo.findById.mockResolvedValue(mockCreditCardPM);
      mockRepo.create.mockResolvedValue({ id: 'plan-uuid' });
      mockTransactionsService.createInstallmentBatch.mockResolvedValue(undefined);
      mockRepo.findById.mockResolvedValue(mockPlan);

      const result = await service.create('user-uuid', validDto);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid',
          installmentCount: 3,
          firstReferenceMonth: '2026-03', // purchaseDay(5) <= closingDay(10)
        }),
        expect.anything(),
      );
      expect(mockTransactionsService.createInstallmentBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ referenceMonth: '2026-03', amountCents: BigInt(200000) }),
          expect.objectContaining({ referenceMonth: '2026-04', amountCents: BigInt(200000) }),
          expect.objectContaining({ referenceMonth: '2026-05', amountCents: BigInt(200000) }),
        ]),
        expect.anything(),
      );
      expect(result.id).toBe('plan-uuid');
    });

    it('assigns remainder to last installment when total is not evenly divisible', async () => {
      mockPaymentMethodsRepo.findById.mockResolvedValue(mockCreditCardPM);
      mockRepo.create.mockResolvedValue({ id: 'plan-uuid' });
      mockTransactionsService.createInstallmentBatch.mockResolvedValue(undefined);
      mockRepo.findById.mockResolvedValue(mockPlan);

      // 100001 / 3 = 33333 rem 2 → [33333, 33333, 33335]
      await service.create('user-uuid', { ...validDto, totalAmountCents: 100001, installmentCount: 3 });

      const batchCall = mockTransactionsService.createInstallmentBatch.mock.calls[0][0];
      expect(batchCall[0].amountCents).toBe(BigInt(33333));
      expect(batchCall[1].amountCents).toBe(BigInt(33333));
      expect(batchCall[2].amountCents).toBe(BigInt(33335));
    });
  });

  describe('cancel', () => {
    it('throws EntityNotFoundException when plan not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.cancel('plan-uuid', 'user-uuid')).rejects.toThrow(EntityNotFoundException);
    });

    it('throws PLAN_NOT_ACTIVE when plan is already cancelled', async () => {
      mockRepo.findById.mockResolvedValue({ ...mockPlan, status: InstallmentStatus.CANCELLED });

      const err = await service.cancel('plan-uuid', 'user-uuid').catch((e) => e);
      expect(err).toBeInstanceOf(BusinessRuleException);
      expect(err.code).toBe('PLAN_NOT_ACTIVE');
    });

    it('cancels plan and soft-deletes only future installments', async () => {
      mockRepo.findById.mockResolvedValue(mockPlan); // 3 transactions
      mockTxnsRepo.findFutureInstallments.mockResolvedValue([
        mockPlan.transactions[2], // only txn-3 (2026-04) is future relative to now (2026-03)
      ]);
      mockRepo.cancel.mockResolvedValue(undefined);

      const result = await service.cancel('plan-uuid', 'user-uuid');

      expect(result).toEqual({ cancelledCount: 1, preservedCount: 2 });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('delegates to repository', async () => {
      mockRepo.findAllByUser.mockResolvedValue([mockPlan]);
      const result = await service.findAll('user-uuid');
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('returns plan when found', async () => {
      mockRepo.findById.mockResolvedValue(mockPlan);
      const result = await service.findById('plan-uuid', 'user-uuid');
      expect(result.id).toBe('plan-uuid');
    });

    it('throws EntityNotFoundException when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findById('plan-uuid', 'user-uuid')).rejects.toThrow(EntityNotFoundException);
    });
  });
});
