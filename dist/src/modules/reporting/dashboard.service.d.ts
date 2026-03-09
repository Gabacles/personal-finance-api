import { PrismaService } from '../../shared/database/prisma.service';
import { RecurringService } from '../recurring/recurring.service';
import { MonthlySummary, SummaryService } from './summary.service';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export interface MonthProjection {
    month: string;
    confidence: ConfidenceLevel;
    projectedExpenseCents: bigint;
    projectedIncomeCents: bigint;
    projectedBalanceCents: bigint;
    breakdown: {
        installmentCents: bigint;
        oneTimeCents: bigint;
        recurringExpenseCents: bigint;
        recurringIncomeCents: bigint;
        committedIncomeCents: bigint;
    };
}
export interface Dashboard {
    currentMonth: MonthlySummary;
    projections: MonthProjection[];
}
export declare class DashboardService {
    private readonly summaryService;
    private readonly recurringService;
    private readonly prisma;
    constructor(summaryService: SummaryService, recurringService: RecurringService, prisma: PrismaService);
    get(userId: string, month: string, projectionMonths?: number): Promise<Dashboard>;
}
