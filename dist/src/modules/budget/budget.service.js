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
exports.BudgetService = void 0;
const common_1 = require("@nestjs/common");
const domain_exceptions_1 = require("../../shared/exceptions/domain.exceptions");
const prisma_service_1 = require("../../shared/database/prisma.service");
const budget_repository_1 = require("./budget.repository");
let BudgetService = class BudgetService {
    constructor(budgetRepository, prisma) {
        this.budgetRepository = budgetRepository;
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const existing = await this.budgetRepository.findByMonth(userId, dto.referenceMonth);
        if (existing) {
            throw new domain_exceptions_1.BusinessRuleException('BUDGET_ALREADY_EXISTS', `A budget already exists for ${dto.referenceMonth}. Use PATCH /budgets/${dto.referenceMonth} to update it.`);
        }
        const budget = await this.prisma.$transaction(async (tx) => {
            const created = await this.budgetRepository.create({
                userId,
                referenceMonth: dto.referenceMonth,
                totalBudgetCents: BigInt(dto.totalBudgetCents),
            }, tx);
            if (dto.allocations && dto.allocations.length > 0) {
                await this.budgetRepository.createAllocations(dto.allocations.map((a) => ({
                    monthlyBudgetId: created.id,
                    label: a.label,
                    allocatedCents: BigInt(a.allocatedCents),
                    categoryId: a.categoryId ?? null,
                })), tx);
            }
            return created;
        });
        const full = await this.budgetRepository.findById(budget.id, userId);
        if (!full)
            throw new domain_exceptions_1.EntityNotFoundException('MonthlyBudget', budget.id);
        return full;
    }
    async findAll(userId) {
        return this.budgetRepository.findAllByUser(userId);
    }
    async findByMonth(userId, month) {
        const budget = await this.budgetRepository.findByMonth(userId, month);
        if (!budget)
            throw new domain_exceptions_1.EntityNotFoundException('MonthlyBudget', month);
        return budget;
    }
    async update(userId, month, dto) {
        const budget = await this.budgetRepository.findByMonth(userId, month);
        if (!budget)
            throw new domain_exceptions_1.EntityNotFoundException('MonthlyBudget', month);
        await this.prisma.$transaction(async (tx) => {
            if (dto.totalBudgetCents !== undefined) {
                await this.budgetRepository.update(budget.id, { totalBudgetCents: BigInt(dto.totalBudgetCents) }, tx);
            }
            if (dto.allocations !== undefined) {
                await this.budgetRepository.deleteAllocations(budget.id, tx);
                if (dto.allocations.length > 0) {
                    await this.budgetRepository.createAllocations(dto.allocations.map((a) => ({
                        monthlyBudgetId: budget.id,
                        label: a.label,
                        allocatedCents: BigInt(a.allocatedCents),
                        categoryId: a.categoryId ?? null,
                    })), tx);
                }
            }
        });
        const full = await this.budgetRepository.findById(budget.id, userId);
        if (!full)
            throw new domain_exceptions_1.EntityNotFoundException('MonthlyBudget', budget.id);
        return full;
    }
    async remove(userId, month) {
        const budget = await this.budgetRepository.findByMonth(userId, month);
        if (!budget)
            throw new domain_exceptions_1.EntityNotFoundException('MonthlyBudget', month);
        await this.budgetRepository.delete(budget.id);
    }
};
exports.BudgetService = BudgetService;
exports.BudgetService = BudgetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [budget_repository_1.BudgetRepository,
        prisma_service_1.PrismaService])
], BudgetService);
//# sourceMappingURL=budget.service.js.map