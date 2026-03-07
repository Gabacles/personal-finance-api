import { Injectable } from '@nestjs/common';
import { CreditCard, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class CreditCardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CreditCardCreateInput): Promise<CreditCard> {
    return this.prisma.creditCard.create({ data });
  }

  async findByPaymentMethodId(
    paymentMethodId: string,
  ): Promise<CreditCard | null> {
    return this.prisma.creditCard.findUnique({ where: { paymentMethodId } });
  }
}
