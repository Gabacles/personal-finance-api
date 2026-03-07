import { Injectable } from '@nestjs/common';
import { PaymentMethodType, TransactionType } from '@prisma/client';
import { computeStatementMonth } from '../payment-methods/credit-card-statement.service';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import { PaymentMethodsRepository } from '../payment-methods/payment-methods.repository';
import { CategoriesService } from '../categories/categories.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionWithRelations } from '../transactions/transactions.repository';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly paymentMethodsRepository: PaymentMethodsRepository,
    private readonly categoriesService: CategoriesService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(
    userId: string,
    dto: CreatePurchaseDto,
  ): Promise<TransactionWithRelations> {
    // 1. Validate payment method ownership + CREDIT_CARD type
    const paymentMethod = await this.paymentMethodsRepository.findById(
      dto.paymentMethodId,
      userId,
    );
    if (!paymentMethod) {
      throw new EntityNotFoundException('PaymentMethod', dto.paymentMethodId);
    }
    if (paymentMethod.type !== PaymentMethodType.CREDIT_CARD) {
      throw new BusinessRuleException(
        'PAYMENT_METHOD_NOT_CREDIT_CARD',
        'Purchases can only be made with a CREDIT_CARD payment method',
      );
    }
    if (!paymentMethod.creditCard) {
      throw new BusinessRuleException(
        'CREDIT_CARD_MISSING',
        'The credit card details are missing for this payment method',
      );
    }

    // 2. Validate category ownership + EXPENSE type (if provided)
    if (dto.categoryId) {
      await this.categoriesService.validateOwnershipAndType(
        dto.categoryId,
        userId,
        TransactionType.EXPENSE,
      );
    }

    // 3. Validate purchase date is not in the future
    const purchaseDate = new Date(dto.purchaseDate);
    const today = new Date();
    today.setUTCHours(23, 59, 59, 999); // allow today
    if (purchaseDate > today) {
      throw new BusinessRuleException(
        'FUTURE_PURCHASE_DATE',
        'Purchase date cannot be in the future',
      );
    }

    // 4. Compute reference month from credit card closing day
    const { referenceMonth } = computeStatementMonth(
      paymentMethod.creditCard.closingDay,
      purchaseDate,
    );

    // 5. Create the expense transaction
    return this.transactionsService.createExpense({
      userId,
      categoryId: dto.categoryId,
      paymentMethodId: dto.paymentMethodId,
      description: dto.description,
      amountCents: BigInt(dto.amountCents),
      referenceMonth,
      transactionDate: purchaseDate,
      notes: dto.notes,
    });
  }
}
