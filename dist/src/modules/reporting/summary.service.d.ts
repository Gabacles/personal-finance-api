import { PrismaService } from '../../shared/database/prisma.service';
import { RecurringService } from '../recurring/recurring.service';
export interface CategoryBreakdown {
    categoryId: string;
    categoryName: string;
    totalCents: bigint;
}
export interface PaymentMethodBreakdown {
    paymentMethodId: string;
    paymentMethodName: string;
    totalCents: bigint;
}
export interface MonthlySummary {
    month: string;
    recurringGenerated: number;
    recurringSkipped: number;
    totalGrossCents: bigint;
    totalNetIncomeCents: bigint;
    totalDeductionCents: bigint;
    totalExpenseCents: bigint;
    oneTimeCents: bigint;
    installmentCents: bigint;
    recurringExpenseCents: bigint;
    balanceCents: bigint;
    byCategory: CategoryBreakdown[];
    byPaymentMethod: PaymentMethodBreakdown[];
    transactions: any[];
    incomeEntry: any | null;
}
export declare class SummaryService {
    private readonly recurringService;
    private readonly prisma;
    constructor(recurringService: RecurringService, prisma: PrismaService);
    getForMonth(userId: string, month: string): Promise<MonthlySummary>;
}
