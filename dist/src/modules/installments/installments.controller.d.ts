import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { CreateInstallmentPlanDto } from './dto/create-installment-plan.dto';
import { InstallmentsService } from './installments.service';
export declare class InstallmentsController {
    private readonly installmentsService;
    constructor(installmentsService: InstallmentsService);
    create(user: AuthenticatedUser, dto: CreateInstallmentPlanDto): Promise<{
        transactions: ({
            category: {
                id: string;
                type: import(".prisma/client").$Enums.TransactionType;
                createdAt: Date;
                name: string;
                userId: string | null;
                isSystem: boolean;
                deletedAt: Date | null;
            } | null;
            paymentMethod: {
                id: string;
                type: import(".prisma/client").$Enums.PaymentMethodType;
                createdAt: Date;
                name: string;
                userId: string;
                deletedAt: Date | null;
                updatedAt: Date;
            } | null;
        } & {
            id: string;
            type: import(".prisma/client").$Enums.TransactionType;
            createdAt: Date;
            description: string;
            userId: string;
            deletedAt: Date | null;
            categoryId: string | null;
            updatedAt: Date;
            amountCents: bigint;
            origin: import(".prisma/client").$Enums.TransactionOrigin;
            referenceMonth: string;
            transactionDate: Date;
            notes: string | null;
            paymentMethodId: string | null;
            installmentPlanId: string | null;
            recurringTransactionId: string | null;
            incomeEntryId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.InstallmentStatus;
        description: string;
        userId: string;
        deletedAt: Date | null;
        categoryId: string | null;
        updatedAt: Date;
        notes: string | null;
        paymentMethodId: string;
        totalAmountCents: bigint;
        installmentCount: number;
        firstReferenceMonth: string;
        purchaseDate: Date;
    }>;
    findAll(user: AuthenticatedUser): Promise<({
        transactions: ({
            category: {
                id: string;
                type: import(".prisma/client").$Enums.TransactionType;
                createdAt: Date;
                name: string;
                userId: string | null;
                isSystem: boolean;
                deletedAt: Date | null;
            } | null;
            paymentMethod: {
                id: string;
                type: import(".prisma/client").$Enums.PaymentMethodType;
                createdAt: Date;
                name: string;
                userId: string;
                deletedAt: Date | null;
                updatedAt: Date;
            } | null;
        } & {
            id: string;
            type: import(".prisma/client").$Enums.TransactionType;
            createdAt: Date;
            description: string;
            userId: string;
            deletedAt: Date | null;
            categoryId: string | null;
            updatedAt: Date;
            amountCents: bigint;
            origin: import(".prisma/client").$Enums.TransactionOrigin;
            referenceMonth: string;
            transactionDate: Date;
            notes: string | null;
            paymentMethodId: string | null;
            installmentPlanId: string | null;
            recurringTransactionId: string | null;
            incomeEntryId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.InstallmentStatus;
        description: string;
        userId: string;
        deletedAt: Date | null;
        categoryId: string | null;
        updatedAt: Date;
        notes: string | null;
        paymentMethodId: string;
        totalAmountCents: bigint;
        installmentCount: number;
        firstReferenceMonth: string;
        purchaseDate: Date;
    })[]>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        transactions: ({
            category: {
                id: string;
                type: import(".prisma/client").$Enums.TransactionType;
                createdAt: Date;
                name: string;
                userId: string | null;
                isSystem: boolean;
                deletedAt: Date | null;
            } | null;
            paymentMethod: {
                id: string;
                type: import(".prisma/client").$Enums.PaymentMethodType;
                createdAt: Date;
                name: string;
                userId: string;
                deletedAt: Date | null;
                updatedAt: Date;
            } | null;
        } & {
            id: string;
            type: import(".prisma/client").$Enums.TransactionType;
            createdAt: Date;
            description: string;
            userId: string;
            deletedAt: Date | null;
            categoryId: string | null;
            updatedAt: Date;
            amountCents: bigint;
            origin: import(".prisma/client").$Enums.TransactionOrigin;
            referenceMonth: string;
            transactionDate: Date;
            notes: string | null;
            paymentMethodId: string | null;
            installmentPlanId: string | null;
            recurringTransactionId: string | null;
            incomeEntryId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.InstallmentStatus;
        description: string;
        userId: string;
        deletedAt: Date | null;
        categoryId: string | null;
        updatedAt: Date;
        notes: string | null;
        paymentMethodId: string;
        totalAmountCents: bigint;
        installmentCount: number;
        firstReferenceMonth: string;
        purchaseDate: Date;
    }>;
    cancel(user: AuthenticatedUser, id: string): Promise<import("./installments.service").CancelResult>;
}
