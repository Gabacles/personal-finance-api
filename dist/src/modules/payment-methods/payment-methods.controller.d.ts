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
        name: string;
        id: string;
        userId: string;
        type: import(".prisma/client").$Enums.PaymentMethodType;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
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
        name: string;
        id: string;
        userId: string;
        type: import(".prisma/client").$Enums.PaymentMethodType;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
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
        name: string;
        id: string;
        userId: string;
        type: import(".prisma/client").$Enums.PaymentMethodType;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
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
        name: string;
        id: string;
        userId: string;
        type: import(".prisma/client").$Enums.PaymentMethodType;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
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
            name: string;
            id: string;
            userId: string;
            type: import(".prisma/client").$Enums.PaymentMethodType;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        };
        referenceMonth: string;
        totalCents: bigint;
        transactions: ({
            paymentMethod: ({
                creditCard: {
                    id: string;
                    paymentMethodId: string;
                    closingDay: number;
                    dueDay: number;
                    creditLimitCents: bigint | null;
                } | null;
            } & {
                name: string;
                id: string;
                userId: string;
                type: import(".prisma/client").$Enums.PaymentMethodType;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
            }) | null;
            category: {
                name: string;
                id: string;
                userId: string | null;
                type: import(".prisma/client").$Enums.TransactionType;
                createdAt: Date;
                deletedAt: Date | null;
                isSystem: boolean;
            } | null;
            installmentPlan: {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                categoryId: string | null;
                paymentMethodId: string;
                description: string;
                notes: string | null;
                totalAmountCents: bigint;
                installmentCount: number;
                firstReferenceMonth: string;
                status: import(".prisma/client").$Enums.InstallmentStatus;
                purchaseDate: Date;
            } | null;
        } & {
            id: string;
            userId: string;
            type: import(".prisma/client").$Enums.TransactionType;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            categoryId: string | null;
            paymentMethodId: string | null;
            installmentPlanId: string | null;
            recurringTransactionId: string | null;
            incomeEntryId: string | null;
            description: string;
            amountCents: bigint;
            origin: import(".prisma/client").$Enums.TransactionOrigin;
            referenceMonth: string;
            transactionDate: Date;
            notes: string | null;
        })[];
    }>;
}
export {};
