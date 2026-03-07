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
const transactions_repository_1 = require("./transactions.repository");
let TransactionsService = class TransactionsService {
    constructor(transactionsRepository) {
        this.transactionsRepository = transactionsRepository;
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
    __metadata("design:paramtypes", [transactions_repository_1.TransactionsRepository])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map