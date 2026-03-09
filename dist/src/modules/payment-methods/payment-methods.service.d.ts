import { PaymentMethodType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodWithCard, PaymentMethodsRepository } from './payment-methods.repository';
export declare class PaymentMethodsService {
    private readonly paymentMethodsRepository;
    private readonly prisma;
    constructor(paymentMethodsRepository: PaymentMethodsRepository, prisma: PrismaService);
    create(userId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethodWithCard>;
    findAll(userId: string, type?: PaymentMethodType): Promise<PaymentMethodWithCard[]>;
    findById(id: string, userId: string): Promise<PaymentMethodWithCard>;
    update(id: string, userId: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethodWithCard>;
    remove(id: string, userId: string): Promise<void>;
    getStatement(id: string, userId: string, month: string): Promise<{
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
