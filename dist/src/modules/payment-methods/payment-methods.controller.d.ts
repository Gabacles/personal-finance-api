import { PaymentMethodType } from '@prisma/client';
import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodsService } from './payment-methods.service';
declare class PaymentMethodsFilterDto {
    type?: PaymentMethodType;
}
declare class StatementQueryDto {
    month: string;
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
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
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
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
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
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdatePaymentMethodDto): Promise<{
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
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<void>;
    getStatement(user: AuthenticatedUser, id: string, query: StatementQueryDto): Promise<{
        paymentMethod: {
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
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
        };
        referenceMonth: string;
        totalCents: bigint;
        transactions: ({
            category: {
                isSystem: boolean;
                id: string;
                type: import(".prisma/client").$Enums.TransactionType;
                createdAt: Date;
                name: string;
                deletedAt: Date | null;
                userId: string | null;
            } | null;
            paymentMethod: ({
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
                updatedAt: Date;
                deletedAt: Date | null;
                userId: string;
            }) | null;
            installmentPlan: {
                id: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.InstallmentStatus;
                description: string;
                updatedAt: Date;
                deletedAt: Date | null;
                userId: string;
                notes: string | null;
                categoryId: string | null;
                paymentMethodId: string;
                totalAmountCents: bigint;
                installmentCount: number;
                firstReferenceMonth: string;
                purchaseDate: Date;
            } | null;
        } & {
            id: string;
            type: import(".prisma/client").$Enums.TransactionType;
            createdAt: Date;
            description: string;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
            amountCents: bigint;
            origin: import(".prisma/client").$Enums.TransactionOrigin;
            referenceMonth: string;
            transactionDate: Date;
            notes: string | null;
            categoryId: string | null;
            paymentMethodId: string | null;
            installmentPlanId: string | null;
            recurringTransactionId: string | null;
            incomeEntryId: string | null;
        })[];
    }>;
}
export {};
