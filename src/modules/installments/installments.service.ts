import { Injectable } from '@nestjs/common';
import { InstallmentStatus, PaymentMethodType, Prisma, TransactionType } from '@prisma/client';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import { PrismaService } from '../../shared/database/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import { PaymentMethodsRepository } from '../payment-methods/payment-methods.repository';
import { computeStatementMonth } from '../payment-methods/credit-card-statement.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionsRepository } from '../transactions/transactions.repository';
import {
  calculateInstallmentAmounts,
  computeInstallmentReferenceMonths,
} from './installment-calculator';
import { InstallmentPlanWithTransactions, InstallmentsRepository } from './installments.repository';
import { CreateInstallmentPlanDto } from './dto/create-installment-plan.dto';

export interface CancelResult {
  cancelledCount: number;
  preservedCount: number;
}

function currentReferenceMonth(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

@Injectable()
export class InstallmentsService {
  constructor(
    private readonly installmentsRepository: InstallmentsRepository,
    private readonly transactionsRepository: TransactionsRepository,
    private readonly paymentMethodsRepository: PaymentMethodsRepository,
    private readonly categoriesService: CategoriesService,
    private readonly transactionsService: TransactionsService,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    dto: CreateInstallmentPlanDto,
  ): Promise<InstallmentPlanWithTransactions> {
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
        'Installment plans can only be created with a CREDIT_CARD payment method',
      );
    }
    if (!paymentMethod.creditCard) {
      throw new BusinessRuleException(
        'CREDIT_CARD_MISSING',
        'The credit card details are missing for this payment method',
      );
    }

    // 2. Validate category (if provided)
    if (dto.categoryId) {
      await this.categoriesService.validateOwnershipAndType(
        dto.categoryId,
        userId,
        TransactionType.EXPENSE,
      );
    }

    // 3. Validate installment count >= 2 (DTO @Min(2) handles this, but belt-and-suspenders)
    if (dto.installmentCount < 2) {
      throw new BusinessRuleException(
        'INSTALLMENT_COUNT_TOO_LOW',
        'Installment count must be at least 2',
      );
    }

    // 4. Validate purchase date is not in the future
    const purchaseDate = new Date(dto.purchaseDate);
    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);
    if (purchaseDate > today) {
      throw new BusinessRuleException(
        'FUTURE_PURCHASE_DATE',
        'Purchase date cannot be in the future',
      );
    }

    // 5. Compute first reference month
    const { referenceMonth: firstReferenceMonth } = computeStatementMonth(
      paymentMethod.creditCard.closingDay,
      purchaseDate,
    );

    // 6. Calculate per-installment amounts and months
    const amounts = calculateInstallmentAmounts(
      BigInt(dto.totalAmountCents),
      dto.installmentCount,
    );
    const months = computeInstallmentReferenceMonths(
      firstReferenceMonth,
      dto.installmentCount,
    );

    // 7. Atomic: create plan row + all transaction rows
    const plan = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const plan = await this.installmentsRepository.create(
        {
          userId,
          paymentMethodId: dto.paymentMethodId,
          categoryId: dto.categoryId,
          description: dto.description,
          totalAmountCents: BigInt(dto.totalAmountCents),
          installmentCount: dto.installmentCount,
          firstReferenceMonth,
          purchaseDate,
          notes: dto.notes,
        },
        tx,
      );

      await this.transactionsService.createInstallmentBatch(
        amounts.map((amountCents, i) => ({
          userId,
          categoryId: dto.categoryId,
          paymentMethodId: dto.paymentMethodId,
          installmentPlanId: plan.id,
          description: `${dto.description} (${i + 1}/${dto.installmentCount})`,
          amountCents,
          referenceMonth: months[i],
          transactionDate: purchaseDate,
          notes: dto.notes,
        })),
        tx,
      );

      return plan;
    });

    // Return with transactions included
    const full = await this.installmentsRepository.findById(plan.id, userId);
    if (!full) throw new EntityNotFoundException('InstallmentPlan', plan.id);
    return full;
  }

  async cancel(
    id: string,
    userId: string,
  ): Promise<CancelResult> {
    const plan = await this.installmentsRepository.findById(id, userId);
    if (!plan) throw new EntityNotFoundException('InstallmentPlan', id);

    if (plan.status !== InstallmentStatus.ACTIVE) {
      throw new BusinessRuleException(
        'PLAN_NOT_ACTIVE',
        'Only active installment plans can be cancelled',
      );
    }

    const currentMonth = currentReferenceMonth();
    const futureTransactions = await this.transactionsRepository.findFutureInstallments(
      id,
      currentMonth,
    );

    const cancelledCount = futureTransactions.length;
    const preservedCount = plan.transactions.length - cancelledCount;

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Soft-delete all future installment transactions
      for (const txn of futureTransactions) {
        await tx.transaction.update({
          where: { id: txn.id },
          data: { deletedAt: new Date() },
        });
      }
      await this.installmentsRepository.cancel(id, tx);
    });

    return { cancelledCount, preservedCount };
  }

  async findAll(userId: string): Promise<InstallmentPlanWithTransactions[]> {
    return this.installmentsRepository.findAllByUser(userId);
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<InstallmentPlanWithTransactions> {
    const plan = await this.installmentsRepository.findById(id, userId);
    if (!plan) throw new EntityNotFoundException('InstallmentPlan', id);
    return plan;
  }
}
