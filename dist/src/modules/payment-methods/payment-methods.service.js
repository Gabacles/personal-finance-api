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
exports.PaymentMethodsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../shared/database/prisma.service");
const domain_exceptions_1 = require("../../shared/exceptions/domain.exceptions");
const payment_methods_repository_1 = require("./payment-methods.repository");
let PaymentMethodsService = class PaymentMethodsService {
    constructor(paymentMethodsRepository, prisma) {
        this.paymentMethodsRepository = paymentMethodsRepository;
        this.prisma = prisma;
    }
    async create(userId, dto) {
        if (dto.type === client_1.PaymentMethodType.CREDIT_CARD &&
            !dto.creditCard) {
            throw new domain_exceptions_1.BusinessRuleException('CREDIT_CARD_DETAILS_REQUIRED', 'Credit card details (closingDay, dueDay) are required for CREDIT_CARD type');
        }
        return this.prisma.$transaction(async (tx) => {
            const paymentMethod = await tx.paymentMethod.create({
                data: {
                    userId,
                    name: dto.name,
                    type: dto.type,
                    ...(dto.type === client_1.PaymentMethodType.CREDIT_CARD &&
                        dto.creditCard && {
                        creditCard: {
                            create: {
                                closingDay: dto.creditCard.closingDay,
                                dueDay: dto.creditCard.dueDay,
                                creditLimitCents: dto.creditCard.creditLimitCents ?? null,
                            },
                        },
                    }),
                },
                include: { creditCard: true },
            });
            return paymentMethod;
        });
    }
    async findAll(userId, type) {
        return this.paymentMethodsRepository.findAllByUser(userId, type);
    }
    async findById(id, userId) {
        const pm = await this.paymentMethodsRepository.findById(id, userId);
        if (!pm)
            throw new domain_exceptions_1.EntityNotFoundException('PaymentMethod', id);
        return pm;
    }
    async update(id, userId, dto) {
        const pm = await this.paymentMethodsRepository.findById(id, userId);
        if (!pm)
            throw new domain_exceptions_1.EntityNotFoundException('PaymentMethod', id);
        if (dto.creditCard && pm.type !== client_1.PaymentMethodType.CREDIT_CARD) {
            throw new domain_exceptions_1.BusinessRuleException('CREDIT_CARD_UPDATE_ON_NON_CARD', 'Cannot update credit card details on a non-credit-card payment method');
        }
        return this.paymentMethodsRepository.update(id, {
            name: dto.name,
            creditCard: dto.creditCard,
        });
    }
    async remove(id, userId) {
        const pm = await this.paymentMethodsRepository.findById(id, userId);
        if (!pm)
            throw new domain_exceptions_1.EntityNotFoundException('PaymentMethod', id);
        const now = new Date();
        const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
        const futureInstallments = await this.prisma.transaction.count({
            where: {
                paymentMethodId: id,
                origin: client_1.TransactionOrigin.INSTALLMENT,
                referenceMonth: { gte: currentMonth },
                deletedAt: null,
            },
        });
        if (futureInstallments > 0) {
            throw new domain_exceptions_1.BusinessRuleException('PAYMENT_METHOD_HAS_ACTIVE_INSTALLMENTS', 'Cannot delete a payment method with active installment plan obligations');
        }
        await this.paymentMethodsRepository.softDelete(id);
    }
    async getStatement(id, userId, month) {
        const pm = await this.paymentMethodsRepository.findById(id, userId);
        if (!pm)
            throw new domain_exceptions_1.EntityNotFoundException('PaymentMethod', id);
        const transactions = await this.prisma.transaction.findMany({
            where: {
                paymentMethodId: id,
                referenceMonth: month,
                deletedAt: null,
            },
            include: {
                category: true,
                paymentMethod: { include: { creditCard: true } },
                installmentPlan: true,
            },
            orderBy: { transactionDate: 'desc' },
        });
        const totalCents = transactions.reduce((s, t) => s + t.amountCents, 0n);
        return { paymentMethod: pm, referenceMonth: month, totalCents, transactions };
    }
};
exports.PaymentMethodsService = PaymentMethodsService;
exports.PaymentMethodsService = PaymentMethodsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [payment_methods_repository_1.PaymentMethodsRepository,
        prisma_service_1.PrismaService])
], PaymentMethodsService);
//# sourceMappingURL=payment-methods.service.js.map