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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const domain_exceptions_1 = require("../../shared/exceptions/domain.exceptions");
const prisma_service_1 = require("../../shared/database/prisma.service");
const transactions_repository_1 = require("./transactions.repository");
let TransactionsService = class TransactionsService {
    constructor(transactionsRepository, prisma) {
        this.transactionsRepository = transactionsRepository;
        this.prisma = prisma;
    }
    async createExpense(input, tx) {
        return this.transactionsRepository.create({
            userId: input.userId,
            categoryId: input.categoryId,
            paymentMethodId: input.paymentMethodId,
            description: input.description,
            amountCents: input.amountCents,
            type: client_1.TransactionType.EXPENSE,
            origin: client_1.TransactionOrigin.ONE_TIME,
            referenceMonth: input.referenceMonth,
            transactionDate: input.transactionDate,
            notes: input.notes,
        }, tx);
    }
    async createInstallmentBatch(inputs, tx) {
        const data = inputs.map((i) => ({
            userId: i.userId,
            categoryId: i.categoryId,
            paymentMethodId: i.paymentMethodId,
            installmentPlanId: i.installmentPlanId,
            description: i.description,
            amountCents: i.amountCents,
            type: client_1.TransactionType.EXPENSE,
            origin: client_1.TransactionOrigin.INSTALLMENT,
            referenceMonth: i.referenceMonth,
            transactionDate: i.transactionDate,
            notes: i.notes,
        }));
        await this.transactionsRepository.createMany(data, tx);
    }
    async createFromRecurring(input) {
        try {
            return await this.transactionsRepository.create({
                userId: input.userId,
                categoryId: input.categoryId,
                paymentMethodId: input.paymentMethodId,
                recurringTransactionId: input.recurringTransactionId,
                description: input.description,
                amountCents: input.amountCents,
                type: input.type,
                origin: client_1.TransactionOrigin.RECURRING,
                referenceMonth: input.referenceMonth,
                transactionDate: input.transactionDate,
                notes: input.notes,
            });
        }
        catch (err) {
            if (err instanceof library_1.PrismaClientKnownRequestError && err.code === 'P2002') {
                return null;
            }
            throw err;
        }
    }
    async createIncomeTransaction(input, tx) {
        return this.transactionsRepository.create({
            userId: input.userId,
            categoryId: input.categoryId,
            incomeEntryId: input.incomeEntryId,
            description: input.description,
            amountCents: input.amountCents,
            type: client_1.TransactionType.INCOME,
            origin: client_1.TransactionOrigin.INCOME,
            referenceMonth: input.referenceMonth,
            transactionDate: input.transactionDate,
            notes: input.notes,
        }, tx);
    }
    async createDirectExpense(userId, dto) {
        if (dto.paymentMethodId) {
            const pm = await this.prisma.paymentMethod.findFirst({
                where: { id: dto.paymentMethodId, userId, deletedAt: null },
                select: { type: true },
            });
            if (!pm)
                throw new domain_exceptions_1.EntityNotFoundException('PaymentMethod', dto.paymentMethodId);
            if (pm.type === client_1.PaymentMethodType.CREDIT_CARD) {
                throw new domain_exceptions_1.BusinessRuleException('USE_PURCHASES_FOR_CREDIT_CARD', 'Use POST /api/v1/purchases for credit card expenses');
            }
        }
        if (dto.categoryId) {
            const cat = await this.prisma.category.findFirst({
                where: {
                    id: dto.categoryId,
                    deletedAt: null,
                    OR: [{ userId }, { isSystem: true }],
                },
                select: { id: true },
            });
            if (!cat)
                throw new domain_exceptions_1.EntityNotFoundException('Category', dto.categoryId);
        }
        const transactionDate = new Date(dto.transactionDate);
        const referenceMonth = dto.transactionDate.slice(0, 7);
        return this.createExpense({
            userId,
            categoryId: dto.categoryId,
            paymentMethodId: dto.paymentMethodId,
            description: dto.description,
            amountCents: BigInt(dto.amountCents),
            referenceMonth,
            transactionDate,
            notes: dto.notes,
        });
    }
    async update(id, userId, dto) {
        const txn = await this.transactionsRepository.findById(id, userId);
        if (!txn)
            throw new domain_exceptions_1.EntityNotFoundException('Transaction', id);
        if (txn.origin !== client_1.TransactionOrigin.ONE_TIME) {
            throw new domain_exceptions_1.BusinessRuleException('TRANSACTION_NOT_EDITABLE', 'Only one-time transactions can be edited directly');
        }
        return this.transactionsRepository.update(id, {
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.amountCents !== undefined && { amountCents: BigInt(dto.amountCents) }),
            ...(dto.notes !== undefined && { notes: dto.notes }),
            ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        });
    }
    async remove(id, userId) {
        const txn = await this.transactionsRepository.findById(id, userId);
        if (!txn)
            throw new domain_exceptions_1.EntityNotFoundException('Transaction', id);
        if (txn.origin !== client_1.TransactionOrigin.ONE_TIME) {
            throw new domain_exceptions_1.BusinessRuleException('TRANSACTION_NOT_DELETABLE', 'Only one-time transactions can be deleted directly');
        }
        await this.transactionsRepository.softDelete(id);
    }
    async findByFilters(userId, filters, pagination) {
        return this.transactionsRepository.findByFilters(userId, filters, pagination);
    }
    async findById(id, userId) {
        const txn = await this.transactionsRepository.findById(id, userId);
        if (!txn)
            throw new domain_exceptions_1.EntityNotFoundException('Transaction', id);
        return txn;
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [transactions_repository_1.TransactionsRepository,
        prisma_service_1.PrismaService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map