import { Injectable } from '@nestjs/common';
import { TransactionOrigin, TransactionType } from '@prisma/client';
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
    recurringExpenseCents: bigint;
    recurringIncomeCents: bigint;
  };
}

export interface Dashboard {
  currentMonth: MonthlySummary;
  projections: MonthProjection[];
}

function addMonths(month: string, count: number): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, m - 1 + count, 1));
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly summaryService: SummaryService,
    private readonly recurringService: RecurringService,
    private readonly prisma: PrismaService,
  ) {}

  async get(
    userId: string,
    month: string,
    projectionMonths = 3,
  ): Promise<Dashboard> {
    const currentMonth = await this.summaryService.getForMonth(userId, month);

    const projections: MonthProjection[] = await Promise.all(
      Array.from({ length: projectionMonths }, async (_, i) => {
        const futureMonth = addMonths(month, i + 1);
        const confidence: ConfidenceLevel =
          i === 0 ? 'HIGH' : i <= 2 ? 'MEDIUM' : 'LOW';

        // Already-committed installment transactions for this month
        const installmentTxns = await this.prisma.transaction.findMany({
          where: {
            userId,
            referenceMonth: futureMonth,
            origin: TransactionOrigin.INSTALLMENT,
            deletedAt: null,
          },
          select: { amountCents: true },
        });
        const installmentCents = installmentTxns.reduce(
          (s, t) => s + t.amountCents,
          0n,
        );

        // Active recurring templates for this month
        const activeTemplates = await this.recurringService.findActiveForMonth(
          userId,
          futureMonth,
        );
        const recurringExpenseCents = activeTemplates
          .filter((t) => t.type === TransactionType.EXPENSE)
          .reduce((s, t) => s + t.amountCents, 0n);
        const recurringIncomeCents = activeTemplates
          .filter((t) => t.type === TransactionType.INCOME)
          .reduce((s, t) => s + t.amountCents, 0n);

        const projectedExpenseCents = installmentCents + recurringExpenseCents;
        const projectedIncomeCents = recurringIncomeCents;

        return {
          month: futureMonth,
          confidence,
          projectedExpenseCents,
          projectedIncomeCents,
          projectedBalanceCents: projectedIncomeCents - projectedExpenseCents,
          breakdown: {
            installmentCents,
            recurringExpenseCents,
            recurringIncomeCents,
          },
        };
      }),
    );

    return { currentMonth, projections };
  }
}
