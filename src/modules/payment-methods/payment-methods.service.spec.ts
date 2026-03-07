import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
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
};

describe('PaymentMethodsService', () => {
  let service: PaymentMethodsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodsService,
        { provide: PaymentMethodsRepository, useValue: mockRepository },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PaymentMethodsService>(PaymentMethodsService);
    jest.clearAllMocks();
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
});
