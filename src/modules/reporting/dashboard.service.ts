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

        // Already-committed transactions and active templates for this month
        const [installmentTxns, oneTimeTxns, activeTemplates, committedIncomeEntry] =
          await Promise.all([
            this.prisma.transaction.findMany({
              where: {
                userId,
                referenceMonth: futureMonth,
                origin: TransactionOrigin.INSTALLMENT,
                deletedAt: null,
              },
              select: { amountCents: true },
            }),
            this.prisma.transaction.findMany({
              where: {
                userId,
                referenceMonth: futureMonth,
                origin: TransactionOrigin.ONE_TIME,
                type: TransactionType.EXPENSE,
                deletedAt: null,
              },
              select: { amountCents: true },
            }),
            this.recurringService.findActiveForMonth(userId, futureMonth),
            this.prisma.incomeEntry.findFirst({
              where: { userId, referenceMonth: futureMonth, deletedAt: null },
              select: { netCents: true },
            }),
          ]);

        const installmentCents = installmentTxns.reduce(
          (s, t) => s + t.amountCents,
          0n,
        );
        const oneTimeCents = oneTimeTxns.reduce(
          (s, t) => s + t.amountCents,
          0n,
        );

        // Active recurring templates for this month
        const recurringExpenseCents = activeTemplates
          .filter((t) => t.type === TransactionType.EXPENSE)
          .reduce((s, t) => s + t.amountCents, 0n);
        const recurringIncomeCents = activeTemplates
          .filter((t) => t.type === TransactionType.INCOME)
          .reduce((s, t) => s + t.amountCents, 0n);

        // Already-registered income entry for this future month
        const committedIncomeCents = committedIncomeEntry?.netCents ?? 0n;

        const projectedExpenseCents = installmentCents + oneTimeCents + recurringExpenseCents;
        const projectedIncomeCents =
          recurringIncomeCents + committedIncomeCents;

        return {
          month: futureMonth,
          confidence,
          projectedExpenseCents,
          projectedIncomeCents,
          projectedBalanceCents: projectedIncomeCents - projectedExpenseCents,
          breakdown: {
            installmentCents,
            oneTimeCents,
            recurringExpenseCents,
            recurringIncomeCents,
            committedIncomeCents,
          },
        };
      }),
    );

    return { currentMonth, projections };
  }
}
