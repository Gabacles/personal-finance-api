import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { CreateInstallmentPlanDto } from './dto/create-installment-plan.dto';
import { InstallmentsService } from './installments.service';
export declare class InstallmentsController {
    private readonly installmentsService;
    constructor(installmentsService: InstallmentsService);
    create(user: AuthenticatedUser, dto: CreateInstallmentPlanDto): Promise<{
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
            paymentMethod: {
                id: string;
                type: import(".prisma/client").$Enums.PaymentMethodType;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                deletedAt: Date | null;
                userId: string;
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
    } & {
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
    }>;
    findAll(user: AuthenticatedUser): Promise<({
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
            paymentMethod: {
                id: string;
                type: import(".prisma/client").$Enums.PaymentMethodType;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                deletedAt: Date | null;
                userId: string;
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
    } & {
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
    })[]>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
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
            paymentMethod: {
                id: string;
                type: import(".prisma/client").$Enums.PaymentMethodType;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                deletedAt: Date | null;
                userId: string;
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
    } & {
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
    }>;
    cancel(user: AuthenticatedUser, id: string): Promise<import("./installments.service").CancelResult>;
}
