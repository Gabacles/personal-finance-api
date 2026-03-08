import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchasesService } from './purchases.service';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    create(user: AuthenticatedUser, dto: CreatePurchaseDto): Promise<{
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
            userId: string;
            deletedAt: Date | null;
            categoryId: string | null;
            description: string;
            updatedAt: Date;
            notes: string | null;
            paymentMethodId: string;
            totalAmountCents: bigint;
            installmentCount: number;
            firstReferenceMonth: string;
            status: import(".prisma/client").$Enums.InstallmentStatus;
            purchaseDate: Date;
        } | null;
    } & {
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        createdAt: Date;
        userId: string;
        deletedAt: Date | null;
        categoryId: string | null;
        description: string;
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
}
