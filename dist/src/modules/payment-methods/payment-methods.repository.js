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
exports.PaymentMethodsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let PaymentMethodsRepository = class PaymentMethodsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.paymentMethod.create({
            data,
            include: { creditCard: true },
        });
    }
    async findAllByUser(userId, type) {
        return this.prisma.paymentMethod.findMany({
            where: { userId, deletedAt: null, ...(type && { type }) },
            include: { creditCard: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id, userId) {
        return this.prisma.paymentMethod.findFirst({
            where: { id, userId, deletedAt: null },
            include: { creditCard: true },
        });
    }
    async findByIdAny(id) {
        return this.prisma.paymentMethod.findFirst({
            where: { id, deletedAt: null },
        });
    }
    async update(id, data) {
        return this.prisma.paymentMethod.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.creditCard !== undefined && {
                    creditCard: {
                        update: {
                            ...(data.creditCard.closingDay !== undefined && {
                                closingDay: data.creditCard.closingDay,
                            }),
                            ...(data.creditCard.dueDay !== undefined && {
                                dueDay: data.creditCard.dueDay,
                            }),
                            ...(data.creditCard.creditLimitCents !== undefined && {
                                creditLimitCents: data.creditCard.creditLimitCents,
                            }),
                        },
                    },
                }),
            },
            include: { creditCard: true },
        });
    }
    async softDelete(id) {
        await this.prisma.paymentMethod.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
};
exports.PaymentMethodsRepository = PaymentMethodsRepository;
exports.PaymentMethodsRepository = PaymentMethodsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentMethodsRepository);
//# sourceMappingURL=payment-methods.repository.js.map