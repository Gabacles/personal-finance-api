import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodType, TransactionOrigin, TransactionType } from '@prisma/client';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import { CategoriesService } from '../categories/categories.service';
import { PaymentMethodsRepository } from '../payment-methods/payment-methods.repository';
import { TransactionsService } from '../transactions/transactions.service';
import { PurchasesService } from './purchases.service';

const mockCreditCard = {
  id: 'cc-uuid',
  paymentMethodId: 'pm-uuid',
  closingDay: 20,
  dueDay: 27,
  creditLimitCents: null,
};

const mockCreditCardPM = {
  id: 'pm-uuid',
  userId: 'user-uuid',
  name: 'Nubank',
  type: PaymentMethodType.CREDIT_CARD,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  creditCard: mockCreditCard,
};

const mockDebitPM = {
  ...mockCreditCardPM,
  id: 'pm-debit-uuid',
  type: PaymentMethodType.DEBIT_CARD,
  creditCard: null,
};

const mockTransaction = {
  id: 'txn-uuid',
  userId: 'user-uuid',
  categoryId: null,
  paymentMethodId: 'pm-uuid',
  installmentPlanId: null,
  recurringTransactionId: null,
  incomeEntryId: null,
  description: 'Supermercado Extra',
  amountCents: BigInt(4990),
  type: TransactionType.EXPENSE,
  origin: TransactionOrigin.ONE_TIME,
  referenceMonth: '2026-03',
  transactionDate: new Date('2026-03-15'),
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  category: null,
  paymentMethod: mockCreditCardPM,
  installmentPlan: null,
};

const mockPaymentMethodsRepository = {
  findById: jest.fn(),
};

const mockCategoriesService = {
  validateOwnershipAndType: jest.fn(),
};

const mockTransactionsService = {
  createExpense: jest.fn(),
};

describe('PurchasesService', () => {
  let service: PurchasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: PaymentMethodsRepository, useValue: mockPaymentMethodsRepository },
        { provide: CategoriesService, useValue: mockCategoriesService },
        { provide: TransactionsService, useValue: mockTransactionsService },
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
    jest.clearAllMocks();
  });

  // March 5, 2026 — a past date (current date is March 7, 2026)
  const validDto = {
    paymentMethodId: 'pm-uuid',
    description: 'Supermercado Extra',
    amountCents: 4990,
    purchaseDate: '2026-03-05',
  };

  describe('create', () => {
    it('throws EntityNotFoundException when payment method not found', async () => {
      mockPaymentMethodsRepository.findById.mockResolvedValue(null);

      await expect(
        service.create('user-uuid', validDto),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('throws PAYMENT_METHOD_NOT_CREDIT_CARD when payment method is not CREDIT_CARD', async () => {
      mockPaymentMethodsRepository.findById.mockResolvedValue(mockDebitPM);

      await expect(
        service.create('user-uuid', validDto),
      ).rejects.toThrow(BusinessRuleException);

      const error = await service.create('user-uuid', validDto).catch((e) => e);
      expect(error.code).toBe('PAYMENT_METHOD_NOT_CREDIT_CARD');
    });

    it('throws FUTURE_PURCHASE_DATE when purchase_date is in the future', async () => {
      mockPaymentMethodsRepository.findById.mockResolvedValue(mockCreditCardPM);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const error = await service
        .create('user-uuid', { ...validDto, purchaseDate: futureDateStr })
        .catch((e) => e);

      expect(error).toBeInstanceOf(BusinessRuleException);
      expect(error.code).toBe('FUTURE_PURCHASE_DATE');
    });

    it('validates category type when categoryId is provided', async () => {
      mockPaymentMethodsRepository.findById.mockResolvedValue(mockCreditCardPM);
      mockCategoriesService.validateOwnershipAndType.mockRejectedValue(
        new BusinessRuleException('CATEGORY_TYPE_MISMATCH', 'Category type mismatch'),
      );

      await expect(
        service.create('user-uuid', { ...validDto, categoryId: 'cat-uuid' }),
      ).rejects.toThrow(BusinessRuleException);

      expect(mockCategoriesService.validateOwnershipAndType).toHaveBeenCalledWith(
        'cat-uuid',
        'user-uuid',
        TransactionType.EXPENSE,
      );
    });

    it('creates expense with correct referenceMonth computed from closingDay', async () => {
      mockPaymentMethodsRepository.findById.mockResolvedValue(mockCreditCardPM);
      mockCategoriesService.validateOwnershipAndType.mockResolvedValue(undefined);
      mockTransactionsService.createExpense.mockResolvedValue(mockTransaction);

      // purchase on 2026-03-15, closingDay=20 → purchaseDay(15) <= closingDay(20) → same month
      const result = await service.create('user-uuid', validDto);

      // purchaseDay(5) <= closingDay(20) → same month
      expect(mockTransactionsService.createExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceMonth: '2026-03',
          amountCents: BigInt(4990),
        }),
      );
      expect(result.id).toBe('txn-uuid');
    });

    it('computes next-month referenceMonth when purchaseDay > closingDay', async () => {
      // closingDay=1, purchase on 2026-03-05 → purchaseDay(5) > closingDay(1) → 2026-04
      const pmWithClosingDay1 = {
        ...mockCreditCardPM,
        creditCard: { ...mockCreditCard, closingDay: 1 },
      };
      mockPaymentMethodsRepository.findById.mockResolvedValue(pmWithClosingDay1);
      mockTransactionsService.createExpense.mockResolvedValue(mockTransaction);

      await service.create('user-uuid', { ...validDto, purchaseDate: '2026-03-05' });

      expect(mockTransactionsService.createExpense).toHaveBeenCalledWith(
        expect.objectContaining({ referenceMonth: '2026-04' }),
      );
    });
  });
});
