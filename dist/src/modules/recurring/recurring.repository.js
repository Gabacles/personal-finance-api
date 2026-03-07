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
exports.RecurringRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let RecurringRepository = class RecurringRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.recurringTransaction.create({ data });
    }
    async findAllByUser(userId, filters = {}) {
        return this.prisma.recurringTransaction.findMany({
            where: {
                userId,
                deletedAt: null,
                ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
                ...(filters.type ? { type: filters.type } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id, userId) {
        return this.prisma.recurringTransaction.findFirst({
            where: { id, userId, deletedAt: null },
        });
    }
    async findActiveForMonth(userId, month) {
        return this.prisma.recurringTransaction.findMany({
            where: {
                userId,
                isActive: true,
                deletedAt: null,
                startMonth: { lte: month },
                OR: [{ endMonth: null }, { endMonth: { gte: month } }],
            },
        });
    }
    async update(id, data) {
        return this.prisma.recurringTransaction.update({
            where: { id },
            data,
        });
    }
    async softDelete(id) {
        await this.prisma.recurringTransaction.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
    }
};
exports.RecurringRepository = RecurringRepository;
exports.RecurringRepository = RecurringRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecurringRepository);
//# sourceMappingURL=recurring.repository.js.map