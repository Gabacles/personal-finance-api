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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../shared/database/prisma.service");
const recurring_service_1 = require("../recurring/recurring.service");
const summary_service_1 = require("./summary.service");
function addMonths(month, count) {
    const [year, m] = month.split('-').map(Number);
    const date = new Date(Date.UTC(year, m - 1 + count, 1));
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
}
let DashboardService = class DashboardService {
    constructor(summaryService, recurringService, prisma) {
        this.summaryService = summaryService;
        this.recurringService = recurringService;
        this.prisma = prisma;
    }
    async get(userId, month, projectionMonths = 3) {
        const currentMonth = await this.summaryService.getForMonth(userId, month);
        const projections = await Promise.all(Array.from({ length: projectionMonths }, async (_, i) => {
            const futureMonth = addMonths(month, i + 1);
            const confidence = i === 0 ? 'HIGH' : i <= 2 ? 'MEDIUM' : 'LOW';
            const installmentTxns = await this.prisma.transaction.findMany({
                where: {
                    userId,
                    referenceMonth: futureMonth,
                    origin: client_1.TransactionOrigin.INSTALLMENT,
                    deletedAt: null,
                },
                select: { amountCents: true },
            });
            const installmentCents = installmentTxns.reduce((s, t) => s + t.amountCents, 0n);
            const activeTemplates = await this.recurringService.findActiveForMonth(userId, futureMonth);
            const recurringExpenseCents = activeTemplates
                .filter((t) => t.type === client_1.TransactionType.EXPENSE)
                .reduce((s, t) => s + t.amountCents, 0n);
            const recurringIncomeCents = activeTemplates
                .filter((t) => t.type === client_1.TransactionType.INCOME)
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
        }));
        return { currentMonth, projections };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [summary_service_1.SummaryService,
        recurring_service_1.RecurringService,
        prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map