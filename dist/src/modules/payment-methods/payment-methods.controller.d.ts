import { PaymentMethodType } from '@prisma/client';
import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { PaymentMethodsService } from './payment-methods.service';
declare class PaymentMethodsFilterDto {
    type?: PaymentMethodType;
}
export declare class PaymentMethodsController {
    private readonly paymentMethodsService;
    constructor(paymentMethodsService: PaymentMethodsService);
    create(user: AuthenticatedUser, dto: CreatePaymentMethodDto): Promise<{
        creditCard: {
            id: string;
            paymentMethodId: string;
            closingDay: number;
            dueDay: number;
            creditLimitCents: bigint | null;
        } | null;
    } & {
        id: string;
        type: import(".prisma/client").$Enums.PaymentMethodType;
        createdAt: Date;
        name: string;
        userId: string;
        deletedAt: Date | null;
        updatedAt: Date;
    }>;
    findAll(user: AuthenticatedUser, query: PaymentMethodsFilterDto): Promise<({
        creditCard: {
            id: string;
            paymentMethodId: string;
            closingDay: number;
            dueDay: number;
            creditLimitCents: bigint | null;
        } | null;
    } & {
        id: string;
        type: import(".prisma/client").$Enums.PaymentMethodType;
        createdAt: Date;
        name: string;
        userId: string;
        deletedAt: Date | null;
        updatedAt: Date;
    })[]>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        creditCard: {
            id: string;
            paymentMethodId: string;
            closingDay: number;
            dueDay: number;
            creditLimitCents: bigint | null;
        } | null;
    } & {
        id: string;
        type: import(".prisma/client").$Enums.PaymentMethodType;
        createdAt: Date;
        name: string;
        userId: string;
        deletedAt: Date | null;
        updatedAt: Date;
    }>;
}
export {};
