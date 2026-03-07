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
exports.InstallmentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const domain_exceptions_1 = require("../../shared/exceptions/domain.exceptions");
const prisma_service_1 = require("../../shared/database/prisma.service");
const categories_service_1 = require("../categories/categories.service");
const payment_methods_repository_1 = require("../payment-methods/payment-methods.repository");
const credit_card_statement_service_1 = require("../payment-methods/credit-card-statement.service");
const transactions_service_1 = require("../transactions/transactions.service");
const transactions_repository_1 = require("../transactions/transactions.repository");
const installment_calculator_1 = require("./installment-calculator");
const installments_repository_1 = require("./installments.repository");
function currentReferenceMonth() {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
}
let InstallmentsService = class InstallmentsService {
    constructor(installmentsRepository, transactionsRepository, paymentMethodsRepository, categoriesService, transactionsService, prisma) {
        this.installmentsRepository = installmentsRepository;
        this.transactionsRepository = transactionsRepository;
        this.paymentMethodsRepository = paymentMethodsRepository;
        this.categoriesService = categoriesService;
        this.transactionsService = transactionsService;
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const paymentMethod = await this.paymentMethodsRepository.findById(dto.paymentMethodId, userId);
        if (!paymentMethod) {
            throw new domain_exceptions_1.EntityNotFoundException('PaymentMethod', dto.paymentMethodId);
        }
        if (paymentMethod.type !== client_1.PaymentMethodType.CREDIT_CARD) {
            throw new domain_exceptions_1.BusinessRuleException('PAYMENT_METHOD_NOT_CREDIT_CARD', 'Installment plans can only be created with a CREDIT_CARD payment method');
        }
        if (!paymentMethod.creditCard) {
            throw new domain_exceptions_1.BusinessRuleException('CREDIT_CARD_MISSING', 'The credit card details are missing for this payment method');
        }
        if (dto.categoryId) {
            await this.categoriesService.validateOwnershipAndType(dto.categoryId, userId, client_1.TransactionType.EXPENSE);
        }
        if (dto.installmentCount < 2) {
            throw new domain_exceptions_1.BusinessRuleException('INSTALLMENT_COUNT_TOO_LOW', 'Installment count must be at least 2');
        }
        const purchaseDate = new Date(dto.purchaseDate);
        const today = new Date();
        today.setUTCHours(23, 59, 59, 999);
        if (purchaseDate > today) {
            throw new domain_exceptions_1.BusinessRuleException('FUTURE_PURCHASE_DATE', 'Purchase date cannot be in the future');
        }
        const { referenceMonth: firstReferenceMonth } = (0, credit_card_statement_service_1.computeStatementMonth)(paymentMethod.creditCard.closingDay, purchaseDate);
        const amounts = (0, installment_calculator_1.calculateInstallmentAmounts)(BigInt(dto.totalAmountCents), dto.installmentCount);
        const months = (0, installment_calculator_1.computeInstallmentReferenceMonths)(firstReferenceMonth, dto.installmentCount);
        const plan = await this.prisma.$transaction(async (tx) => {
            const plan = await this.installmentsRepository.create({
                userId,
                paymentMethodId: dto.paymentMethodId,
                categoryId: dto.categoryId,
                description: dto.description,
                totalAmountCents: BigInt(dto.totalAmountCents),
                installmentCount: dto.installmentCount,
                firstReferenceMonth,
                purchaseDate,
                notes: dto.notes,
            }, tx);
            await this.transactionsService.createInstallmentBatch(amounts.map((amountCents, i) => ({
                userId,
                categoryId: dto.categoryId,
                paymentMethodId: dto.paymentMethodId,
                installmentPlanId: plan.id,
                description: `${dto.description} (${i + 1}/${dto.installmentCount})`,
                amountCents,
                referenceMonth: months[i],
                transactionDate: purchaseDate,
                notes: dto.notes,
            })), tx);
            return plan;
        });
        const full = await this.installmentsRepository.findById(plan.id, userId);
        if (!full)
            throw new domain_exceptions_1.EntityNotFoundException('InstallmentPlan', plan.id);
        return full;
    }
    async cancel(id, userId) {
        const plan = await this.installmentsRepository.findById(id, userId);
        if (!plan)
            throw new domain_exceptions_1.EntityNotFoundException('InstallmentPlan', id);
        if (plan.status !== client_1.InstallmentStatus.ACTIVE) {
            throw new domain_exceptions_1.BusinessRuleException('PLAN_NOT_ACTIVE', 'Only active installment plans can be cancelled');
        }
        const currentMonth = currentReferenceMonth();
        const futureTransactions = await this.transactionsRepository.findFutureInstallments(id, currentMonth);
        const cancelledCount = futureTransactions.length;
        const preservedCount = plan.transactions.length - cancelledCount;
        await this.prisma.$transaction(async (tx) => {
            for (const txn of futureTransactions) {
                await tx.transaction.update({
                    where: { id: txn.id },
                    data: { deletedAt: new Date() },
                });
            }
            await this.installmentsRepository.cancel(id, tx);
        });
        return { cancelledCount, preservedCount };
    }
    async findAll(userId) {
        return this.installmentsRepository.findAllByUser(userId);
    }
    async findById(id, userId) {
        const plan = await this.installmentsRepository.findById(id, userId);
        if (!plan)
            throw new domain_exceptions_1.EntityNotFoundException('InstallmentPlan', id);
        return plan;
    }
};
exports.InstallmentsService = InstallmentsService;
exports.InstallmentsService = InstallmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [installments_repository_1.InstallmentsRepository,
        transactions_repository_1.TransactionsRepository,
        payment_methods_repository_1.PaymentMethodsRepository,
        categories_service_1.CategoriesService,
        transactions_service_1.TransactionsService,
        prisma_service_1.PrismaService])
], InstallmentsService);
//# sourceMappingURL=installments.service.js.map