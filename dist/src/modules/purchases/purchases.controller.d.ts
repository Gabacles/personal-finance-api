import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchasesService } from './purchases.service';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    create(user: AuthenticatedUser, dto: CreatePurchaseDto): Promise<{
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
    }>;
}
