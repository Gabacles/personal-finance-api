import { PaymentMethodType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodWithCard, PaymentMethodsRepository } from './payment-methods.repository';
import { RecurringService } from '../recurring/recurring.service';
export declare class PaymentMethodsService {
    private readonly paymentMethodsRepository;
    private readonly prisma;
    private readonly recurringService;
    constructor(paymentMethodsRepository: PaymentMethodsRepository, prisma: PrismaService, recurringService: RecurringService);
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
