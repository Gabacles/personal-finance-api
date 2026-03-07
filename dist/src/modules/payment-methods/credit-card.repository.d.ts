import { CreditCard, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
export declare class CreditCardRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.CreditCardCreateInput): Promise<CreditCard>;
    findByPaymentMethodId(paymentMethodId: string): Promise<CreditCard | null>;
}
