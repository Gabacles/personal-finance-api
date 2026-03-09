"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../shared/database/prisma.service");
const recurring_service_1 = require("../recurring/recurring.service");
let SummaryService = class SummaryService {
    constructor(recurringService, prisma) {
        this.recurringService = recurringService;
        this.prisma = prisma;
    }
    async getForMonth(userId, month) {
        const { generated: recurringGenerated, skipped: recurringSkipped } = await this.recurringService.generateForMonth(userId, month);
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
        const expenseTransactions = transactions.filter((t) => t.type === client_1.TransactionType.EXPENSE);
        const totalExpenseCents = expenseTransactions.reduce((s, t) => s + t.amountCents, 0n);
        const oneTimeCents = expenseTransactions
            .filter((t) => t.origin === client_1.TransactionOrigin.ONE_TIME)
            .reduce((s, t) => s + t.amountCents, 0n);
        const installmentCents = expenseTransactions
            .filter((t) => t.origin === client_1.TransactionOrigin.INSTALLMENT)
            .reduce((s, t) => s + t.amountCents, 0n);
        const recurringExpenseCents = expenseTransactions
            .filter((t) => t.origin === client_1.TransactionOrigin.RECURRING)
            .reduce((s, t) => s + t.amountCents, 0n);
        const totalGrossCents = incomeEntry?.grossCents ?? 0n;
        const totalDeductionCents = (incomeEntry?.deductions ?? []).reduce((s, d) => s + d.amountCents, 0n);
        const recurringIncomeCents = transactions
            .filter((t) => t.type === client_1.TransactionType.INCOME &&
            t.origin === client_1.TransactionOrigin.RECURRING)
            .reduce((s, t) => s + t.amountCents, 0n);
        const totalNetIncomeCents = (incomeEntry?.netCents ?? 0n) + recurringIncomeCents;
        const categoryMap = new Map();
        for (const t of expenseTransactions) {
            if (t.categoryId && t.category) {
                const existing = categoryMap.get(t.categoryId) ?? {
                    categoryId: t.categoryId,
                    categoryName: t.category.name,
                    totalCents: 0n,
                };
                categoryMap.set(t.categoryId, {
                    ...existing,
                    totalCents: existing.totalCents + t.amountCents,
                });
            }
        }
        const pmMap = new Map();
        for (const t of expenseTransactions) {
            if (t.paymentMethodId && t.paymentMethod) {
                const existing = pmMap.get(t.paymentMethodId) ?? {
                    paymentMethodId: t.paymentMethodId,
                    paymentMethodName: t.paymentMethod.name,
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
};
exports.SummaryService = SummaryService;
exports.SummaryService = SummaryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [recurring_service_1.RecurringService,
        prisma_service_1.PrismaService])
], SummaryService);
//# sourceMappingURL=summary.service.js.map