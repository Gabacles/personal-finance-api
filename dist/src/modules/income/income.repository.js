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
exports.IncomeRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let IncomeRepository = class IncomeRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data, tx) {
        const client = tx ?? this.prisma;
        return client.incomeEntry.create({ data });
    }
    async findAllByUser(userId) {
        return this.prisma.incomeEntry.findMany({
            where: { userId, deletedAt: null },
            include: { deductions: true },
            orderBy: { referenceMonth: 'desc' },
        });
    }
    async findByMonth(userId, referenceMonth) {
        return this.prisma.incomeEntry.findFirst({
            where: { userId, referenceMonth, deletedAt: null },
            include: { deductions: true },
        });
    }
    async findById(id, userId) {
        return this.prisma.incomeEntry.findFirst({
            where: { id, userId, deletedAt: null },
            include: { deductions: true },
        });
    }
    async update(id, data, tx) {
        const client = tx ?? this.prisma;
        return client.incomeEntry.update({ where: { id }, data });
    }
};
exports.IncomeRepository = IncomeRepository;
exports.IncomeRepository = IncomeRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IncomeRepository);
//# sourceMappingURL=income.repository.js.map