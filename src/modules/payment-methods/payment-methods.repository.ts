import { Injectable } from '@nestjs/common';
import { PaymentMethod, PaymentMethodType, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';

export type PaymentMethodWithCard = Prisma.PaymentMethodGetPayload<{
  include: { creditCard: true };
}>;

@Injectable()
export class PaymentMethodsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.PaymentMethodCreateInput,
  ): Promise<PaymentMethodWithCard> {
    return this.prisma.paymentMethod.create({
      data,
      include: { creditCard: true },
    });
  }

  async findAllByUser(
    userId: string,
    type?: PaymentMethodType,
  ): Promise<PaymentMethodWithCard[]> {
    return this.prisma.paymentMethod.findMany({
      where: { userId, deletedAt: null, ...(type && { type }) },
      include: { creditCard: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<PaymentMethodWithCard | null> {
    return this.prisma.paymentMethod.findFirst({
      where: { id, userId, deletedAt: null },
      include: { creditCard: true },
    });
  }

  async findByIdAny(id: string): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      creditCard?: {
        closingDay?: number;
        dueDay?: number;
        creditLimitCents?: number | null;
      };
    },
  ): Promise<PaymentMethodWithCard> {
    return this.prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.creditCard !== undefined && {
          creditCard: {
            update: {
              ...(data.creditCard.closingDay !== undefined && {
                closingDay: data.creditCard.closingDay,
              }),
              ...(data.creditCard.dueDay !== undefined && {
                dueDay: data.creditCard.dueDay,
              }),
              ...(data.creditCard.creditLimitCents !== undefined && {
                creditLimitCents: data.creditCard.creditLimitCents,
              }),
            },
          },
        }),
      },
      include: { creditCard: true },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.paymentMethod.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
