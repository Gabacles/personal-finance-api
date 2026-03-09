import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    create(user: AuthenticatedUser, dto: CreateTransactionDto): Promise<{
        category: {
            id: string;
            type: import(".prisma/client").$Enums.TransactionType;
            createdAt: Date;
            name: string;
            userId: string | null;
            isSystem: boolean;
            deletedAt: Date | null;
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
            userId: string;
            deletedAt: Date | null;
            updatedAt: Date;
        }) | null;
        installmentPlan: {
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
    }>;
    findAll(user: AuthenticatedUser, query: QueryTransactionsDto): Promise<import("../../shared/pagination/pagination.dto").PaginatedResponse<{
        category: {
            id: string;
            type: import(".prisma/client").$Enums.TransactionType;
            createdAt: Date;
            name: string;
            userId: string | null;
            isSystem: boolean;
            deletedAt: Date | null;
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
            userId: string;
            deletedAt: Date | null;
            updatedAt: Date;
        }) | null;
        installmentPlan: {
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
    }>>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        category: {
            id: string;
            type: import(".prisma/client").$Enums.TransactionType;
            createdAt: Date;
            name: string;
            userId: string | null;
            isSystem: boolean;
            deletedAt: Date | null;
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
            userId: string;
            deletedAt: Date | null;
            updatedAt: Date;
        }) | null;
        installmentPlan: {
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
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateTransactionDto): Promise<{
        category: {
            id: string;
            type: import(".prisma/client").$Enums.TransactionType;
            createdAt: Date;
            name: string;
            userId: string | null;
            isSystem: boolean;
            deletedAt: Date | null;
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
            userId: string;
            deletedAt: Date | null;
            updatedAt: Date;
        }) | null;
        installmentPlan: {
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
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<void>;
}
