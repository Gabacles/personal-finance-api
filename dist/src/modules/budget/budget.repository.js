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
exports.BudgetRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let BudgetRepository = class BudgetRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllByUser(userId) {
        return this.prisma.monthlyBudget.findMany({
            where: { userId },
            include: { allocations: true },
            orderBy: { referenceMonth: 'desc' },
        });
    }
    async findByMonth(userId, month) {
        return this.prisma.monthlyBudget.findFirst({
            where: { userId, referenceMonth: month },
            include: { allocations: true },
        });
    }
    async findById(id, userId) {
        return this.prisma.monthlyBudget.findFirst({
            where: { id, userId },
            include: { allocations: true },
        });
    }
    async create(data, tx) {
        const client = tx ?? this.prisma;
        return client.monthlyBudget.create({ data });
    }
    async update(id, data, tx) {
        const client = tx ?? this.prisma;
        return client.monthlyBudget.update({ where: { id }, data });
    }
    async deleteAllocations(monthlyBudgetId, tx) {
        const client = tx ?? this.prisma;
        await client.budgetAllocation.deleteMany({ where: { monthlyBudgetId } });
    }
    async createAllocations(data, tx) {
        if (data.length === 0)
            return;
        const client = tx ?? this.prisma;
        await client.budgetAllocation.createMany({ data });
    }
    async delete(id) {
        await this.prisma.monthlyBudget.delete({ where: { id } });
    }
};
exports.BudgetRepository = BudgetRepository;
exports.BudgetRepository = BudgetRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BudgetRepository);
//# sourceMappingURL=budget.repository.js.map