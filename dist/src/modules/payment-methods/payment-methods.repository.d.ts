import { PaymentMethod, PaymentMethodType, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
export type PaymentMethodWithCard = Prisma.PaymentMethodGetPayload<{
    include: {
        creditCard: true;
    };
}>;
export declare class PaymentMethodsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.PaymentMethodCreateInput): Promise<PaymentMethodWithCard>;
    findAllByUser(userId: string, type?: PaymentMethodType): Promise<PaymentMethodWithCard[]>;
    findById(id: string, userId: string): Promise<PaymentMethodWithCard | null>;
    findByIdAny(id: string): Promise<PaymentMethod | null>;
    update(id: string, data: {
        name?: string;
        creditCard?: {
            closingDay?: number;
            dueDay?: number;
            creditLimitCents?: number | null;
        };
    }): Promise<PaymentMethodWithCard>;
    softDelete(id: string): Promise<void>;
}
