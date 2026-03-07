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
}
