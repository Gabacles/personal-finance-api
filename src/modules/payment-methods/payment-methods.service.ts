import { Injectable } from '@nestjs/common';
import { PaymentMethodType, TransactionOrigin } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import {
  PaymentMethodWithCard,
  PaymentMethodsRepository,
} from './payment-methods.repository';

@Injectable()
export class PaymentMethodsService {
  constructor(
    private readonly paymentMethodsRepository: PaymentMethodsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    dto: CreatePaymentMethodDto,
  ): Promise<PaymentMethodWithCard> {
    if (
      dto.type === PaymentMethodType.CREDIT_CARD &&
      !dto.creditCard
    ) {
      throw new BusinessRuleException(
        'CREDIT_CARD_DETAILS_REQUIRED',
        'Credit card details (closingDay, dueDay) are required for CREDIT_CARD type',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const paymentMethod = await tx.paymentMethod.create({
        data: {
          userId,
          name: dto.name,
          type: dto.type,
          ...(dto.type === PaymentMethodType.CREDIT_CARD &&
            dto.creditCard && {
              creditCard: {
                create: {
                  closingDay: dto.creditCard.closingDay,
                  dueDay: dto.creditCard.dueDay,
                  creditLimitCents: dto.creditCard.creditLimitCents ?? null,
                },
              },
            }),
        },
        include: { creditCard: true },
      });

      return paymentMethod;
    });
  }

  async findAll(
    userId: string,
    type?: PaymentMethodType,
  ): Promise<PaymentMethodWithCard[]> {
    return this.paymentMethodsRepository.findAllByUser(userId, type);
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<PaymentMethodWithCard> {
    const pm = await this.paymentMethodsRepository.findById(id, userId);
    if (!pm) throw new EntityNotFoundException('PaymentMethod', id);
    return pm;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodWithCard> {
    const pm = await this.paymentMethodsRepository.findById(id, userId);
    if (!pm) throw new EntityNotFoundException('PaymentMethod', id);

    if (dto.creditCard && pm.type !== PaymentMethodType.CREDIT_CARD) {
      throw new BusinessRuleException(
        'CREDIT_CARD_UPDATE_ON_NON_CARD',
        'Cannot update credit card details on a non-credit-card payment method',
      );
    }

    return this.paymentMethodsRepository.update(id, {
      name: dto.name,
      creditCard: dto.creditCard,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const pm = await this.paymentMethodsRepository.findById(id, userId);
    if (!pm) throw new EntityNotFoundException('PaymentMethod', id);

    const now = new Date();
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

    const futureInstallments = await this.prisma.transaction.count({
      where: {
        paymentMethodId: id,
        origin: TransactionOrigin.INSTALLMENT,
        referenceMonth: { gte: currentMonth },
        deletedAt: null,
      },
    });

    if (futureInstallments > 0) {
      throw new BusinessRuleException(
        'PAYMENT_METHOD_HAS_ACTIVE_INSTALLMENTS',
        'Cannot delete a payment method with active installment plan obligations',
      );
    }

    await this.paymentMethodsRepository.softDelete(id);
  }

  async getStatement(id: string, userId: string, month: string) {
    const pm = await this.paymentMethodsRepository.findById(id, userId);
    if (!pm) throw new EntityNotFoundException('PaymentMethod', id);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        paymentMethodId: id,
        referenceMonth: month,
        deletedAt: null,
      },
      include: {
        category: true,
        paymentMethod: { include: { creditCard: true } },
        installmentPlan: true,
      },
      orderBy: { transactionDate: 'desc' },
    });

    const totalCents = transactions.reduce(
      (s, t) => s + t.amountCents,
      0n,
    );

    return { paymentMethod: pm, referenceMonth: month, totalCents, transactions };
  }
}
