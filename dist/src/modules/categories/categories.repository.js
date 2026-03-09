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
exports.CategoriesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let CategoriesRepository = class CategoriesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createUserCategory(data) {
        return this.prisma.category.create({
            data: { ...data, isSystem: false },
        });
    }
    async findAllForUser(userId, type) {
        return this.prisma.category.findMany({
            where: {
                deletedAt: null,
                OR: [{ userId }, { isSystem: true }],
                ...(type && { type }),
            },
            orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
        });
    }
    async findById(id) {
        return this.prisma.category.findFirst({
            where: { id, deletedAt: null },
        });
    }
    async updateName(id, name) {
        return this.prisma.category.update({ where: { id }, data: { name } });
    }
    async softDelete(id) {
        await this.prisma.category.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async countUsage(id) {
        const [txns, recurring] = await Promise.all([
            this.prisma.transaction.count({ where: { categoryId: id, deletedAt: null } }),
            this.prisma.recurringTransaction.count({ where: { categoryId: id, deletedAt: null } }),
        ]);
        return txns + recurring;
    }
};
exports.CategoriesRepository = CategoriesRepository;
exports.CategoriesRepository = CategoriesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesRepository);
//# sourceMappingURL=categories.repository.js.map