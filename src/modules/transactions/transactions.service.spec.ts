import { Test, TestingModule } from '@nestjs/testing';
import { TransactionOrigin, TransactionType } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { EntityNotFoundException } from '../../shared/exceptions/domain.exceptions';
import { TransactionsRepository } from './transactions.repository';
import { TransactionsService } from './transactions.service';

const baseTransaction = {
  id: 'txn-uuid',
  userId: 'user-uuid',
  categoryId: null,
  paymentMethodId: null,
  installmentPlanId: null,
  recurringTransactionId: null,
  incomeEntryId: null,
  description: 'Test expense',
  amountCents: BigInt(5000),
  type: TransactionType.EXPENSE,
  origin: TransactionOrigin.ONE_TIME,
  referenceMonth: '2026-03',
  transactionDate: new Date('2026-03-15'),
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  category: null,
  paymentMethod: null,
  installmentPlan: null,
};

const mockRepo = {
  create: jest.fn(),
  createMany: jest.fn(),
  findByFilters: jest.fn(),
  findById: jest.fn(),
  softDelete: jest.fn(),
  findByRecurringAndMonth: jest.fn(),
  findFutureInstallments: jest.fn(),
};

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: TransactionsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    jest.clearAllMocks();
  });

  describe('createExpense', () => {
    it('delegates to repository with ONE_TIME origin and EXPENSE type', async () => {
      mockRepo.create.mockResolvedValue(baseTransaction);

      const result = await service.createExpense({
        userId: 'user-uuid',
        description: 'Test expense',
        amountCents: BigInt(5000),
        referenceMonth: '2026-03',
        transactionDate: new Date('2026-03-15'),
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TransactionType.EXPENSE,
          origin: TransactionOrigin.ONE_TIME,
        }),
        undefined,
      );
      expect(result.id).toBe('txn-uuid');
    });
  });

  describe('createInstallmentBatch', () => {
    it('delegates all items to createMany with INSTALLMENT origin', async () => {
      mockRepo.createMany.mockResolvedValue([]);
      const mockTx = {} as any;

      await service.createInstallmentBatch(
        [
          {
            userId: 'user-uuid',
            paymentMethodId: 'pm-uuid',
            installmentPlanId: 'plan-uuid',
            description: 'Installment 1/3',
            amountCents: BigInt(1000),
            referenceMonth: '2026-03',
            transactionDate: new Date('2026-03-15'),
          },
          {
            userId: 'user-uuid',
            paymentMethodId: 'pm-uuid',
            installmentPlanId: 'plan-uuid',
            description: 'Installment 2/3',
            amountCents: BigInt(1000),
            referenceMonth: '2026-04',
            transactionDate: new Date('2026-03-15'),
          },
        ],
        mockTx,
      );

      expect(mockRepo.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ origin: TransactionOrigin.INSTALLMENT }),
          expect.objectContaining({ origin: TransactionOrigin.INSTALLMENT }),
        ]),
        mockTx,
      );
    });
  });

  describe('createFromRecurring', () => {
    it('creates a transaction with RECURRING origin', async () => {
      const recurring = {
        ...baseTransaction,
        origin: TransactionOrigin.RECURRING,
        recurringTransactionId: 'rec-uuid',
      };
      mockRepo.create.mockResolvedValue(recurring);

      const result = await service.createFromRecurring({
        userId: 'user-uuid',
        recurringTransactionId: 'rec-uuid',
        description: 'Streaming',
        amountCents: BigInt(4990),
        type: TransactionType.EXPENSE,
        referenceMonth: '2026-03',
        transactionDate: new Date('2026-03-01'),
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: TransactionOrigin.RECURRING,
          recurringTransactionId: 'rec-uuid',
        }),
      );
      expect(result).not.toBeNull();
    });

    it('returns null (silently) on P2002 unique constraint violation', async () => {
      mockRepo.create.mockRejectedValue(
        new PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.0.0',
        }),
      );

      const result = await service.createFromRecurring({
        userId: 'user-uuid',
        recurringTransactionId: 'rec-uuid',
        description: 'Streaming',
        amountCents: BigInt(4990),
        type: TransactionType.EXPENSE,
        referenceMonth: '2026-03',
        transactionDate: new Date('2026-03-01'),
      });

      expect(result).toBeNull();
    });

    it('re-throws non-P2002 errors', async () => {
      mockRepo.create.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        service.createFromRecurring({
          userId: 'user-uuid',
          recurringTransactionId: 'rec-uuid',
          description: 'Streaming',
          amountCents: BigInt(4990),
          type: TransactionType.EXPENSE,
          referenceMonth: '2026-03',
          transactionDate: new Date('2026-03-01'),
        }),
      ).rejects.toThrow('DB connection lost');
    });
  });

  describe('findByFilters', () => {
    it('delegates to repository with userId and filters', async () => {
      const paginated = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      mockRepo.findByFilters.mockResolvedValue(paginated);

      const result = await service.findByFilters(
        'user-uuid',
        { type: TransactionType.EXPENSE },
        { page: 1, limit: 20 },
      );

      expect(mockRepo.findByFilters).toHaveBeenCalledWith(
        'user-uuid',
        { type: TransactionType.EXPENSE },
        { page: 1, limit: 20 },
      );
      expect(result.items).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('returns the transaction when found', async () => {
      mockRepo.findById.mockResolvedValue(baseTransaction);

      const result = await service.findById('txn-uuid', 'user-uuid');

      expect(result.id).toBe('txn-uuid');
    });

    it('throws EntityNotFoundException when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.findById('txn-uuid', 'user-uuid'),
      ).rejects.toThrow(EntityNotFoundException);
    });
  });
});
