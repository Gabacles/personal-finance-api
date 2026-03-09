import { Injectable } from '@nestjs/common';
import { TransactionOrigin, TransactionType } from '@prisma/client';
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
  // Income
  totalGrossCents: bigint;
  totalNetIncomeCents: bigint;
  totalDeductionCents: bigint;
  // Expenses by origin
  totalExpenseCents: bigint;
  oneTimeCents: bigint;
  installmentCents: bigint;
  recurringExpenseCents: bigint;
  // Recurring income (generated from templates)
  recurringIncomeCents: bigint;
  // Balance
  balanceCents: bigint;
  // Breakdowns
  byCategory: CategoryBreakdown[];
  byPaymentMethod: PaymentMethodBreakdown[];
  // Raw data
  transactions: any[];
  incomeEntry: any | null;
}

@Injectable()
export class SummaryService {
  constructor(
    private readonly recurringService: RecurringService,
    private readonly prisma: PrismaService,
  ) {}

  async getForMonth(userId: string, month: string): Promise<MonthlySummary> {
    // 1. Trigger recurring generation (idempotent)
    const { generated: recurringGenerated, skipped: recurringSkipped } =
      await this.recurringService.generateForMonth(userId, month);

    // 2. Fetch transactions + income entry in parallel
    const [transactions, incomeEntry] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId, referenceMonth: month, deletedAt: null },
        include: {
          category: true,
          paymentMethod: { include: { creditCard: true } },
          installmentPlan: true,
        },
        orderBy: { transactionDate: 'desc' },
      }),
      this.prisma.incomeEntry.findFirst({
        where: { userId, referenceMonth: month, deletedAt: null },
        include: { deductions: true },
      }),
    ]);

    // 3. Aggregate expenses
    const expenseTransactions = transactions.filter(
      (t) => t.type === TransactionType.EXPENSE,
    );

    const totalExpenseCents = expenseTransactions.reduce(
      (s, t) => s + t.amountCents,
      0n,
    );
    const oneTimeCents = expenseTransactions
      .filter((t) => t.origin === TransactionOrigin.ONE_TIME)
      .reduce((s, t) => s + t.amountCents, 0n);
    const installmentCents = expenseTransactions
      .filter((t) => t.origin === TransactionOrigin.INSTALLMENT)
      .reduce((s, t) => s + t.amountCents, 0n);
    const recurringExpenseCents = expenseTransactions
      .filter((t) => t.origin === TransactionOrigin.RECURRING)
      .reduce((s, t) => s + t.amountCents, 0n);

    // 4. Income totals
    const totalGrossCents = incomeEntry?.grossCents ?? 0n;
    const totalDeductionCents = (incomeEntry?.deductions ?? []).reduce(
      (s: bigint, d: { amountCents: bigint }) => s + d.amountCents,
      0n,
    );

    // Recurring income transactions generated for this month
    const recurringIncomeCents = transactions
      .filter(
        (t) =>
          t.type === TransactionType.INCOME &&
          t.origin === TransactionOrigin.RECURRING,
      )
      .reduce((s, t) => s + t.amountCents, 0n);

    const totalNetIncomeCents = (incomeEntry?.netCents ?? 0n) + recurringIncomeCents;

    // 5. By category (expenses only)
    const categoryMap = new Map<string, CategoryBreakdown>();
    for (const t of expenseTransactions) {
      if (t.categoryId && t.category) {
        const existing = categoryMap.get(t.categoryId) ?? {
          categoryId: t.categoryId,
          categoryName: (t.category as { name: string }).name,
          totalCents: 0n,
        };
        categoryMap.set(t.categoryId, {
          ...existing,
          totalCents: existing.totalCents + t.amountCents,
        });
      }
    }

    // 6. By payment method (expenses only)
    const pmMap = new Map<string, PaymentMethodBreakdown>();
    for (const t of expenseTransactions) {
      if (t.paymentMethodId && t.paymentMethod) {
        const existing = pmMap.get(t.paymentMethodId) ?? {
          paymentMethodId: t.paymentMethodId,
          paymentMethodName: (t.paymentMethod as { name: string }).name,
          totalCents: 0n,
        };
        pmMap.set(t.paymentMethodId, {
          ...existing,
          totalCents: existing.totalCents + t.amountCents,
        });
      }
    }

    return {
      month,
      recurringGenerated,
      recurringSkipped,
      totalGrossCents,
      totalNetIncomeCents,
      totalDeductionCents,
      totalExpenseCents,
      oneTimeCents,
      installmentCents,
      recurringExpenseCents,
      recurringIncomeCents,
      balanceCents: totalNetIncomeCents - totalExpenseCents,
      byCategory: Array.from(categoryMap.values()),
      byPaymentMethod: Array.from(pmMap.values()),
      transactions,
      incomeEntry,
    };
  }
}
