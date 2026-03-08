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
exports.RecurringService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const domain_exceptions_1 = require("../../shared/exceptions/domain.exceptions");
const categories_service_1 = require("../categories/categories.service");
const payment_methods_repository_1 = require("../payment-methods/payment-methods.repository");
const credit_card_statement_service_1 = require("../payment-methods/credit-card-statement.service");
const transactions_service_1 = require("../transactions/transactions.service");
const recurring_repository_1 = require("./recurring.repository");
function currentReferenceMonth() {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
}
let RecurringService = class RecurringService {
    constructor(recurringRepository, paymentMethodsRepository, categoriesService, transactionsService) {
        this.recurringRepository = recurringRepository;
        this.paymentMethodsRepository = paymentMethodsRepository;
        this.categoriesService = categoriesService;
        this.transactionsService = transactionsService;
    }
    async create(userId, dto) {
        if (dto.type === client_1.TransactionType.INCOME && dto.paymentMethodId) {
            throw new domain_exceptions_1.BusinessRuleException('INCOME_WITH_PAYMENT_METHOD', 'Income recurring transactions cannot have a payment method');
        }
        if (dto.paymentMethodId) {
            const pm = await this.paymentMethodsRepository.findById(dto.paymentMethodId, userId);
            if (!pm)
                throw new domain_exceptions_1.EntityNotFoundException('PaymentMethod', dto.paymentMethodId);
            if (pm.type === client_1.PaymentMethodType.CREDIT_CARD && !dto.dayOfMonth) {
                throw new domain_exceptions_1.BusinessRuleException('CREDIT_CARD_DAY_OF_MONTH_REQUIRED', 'dayOfMonth is required for CREDIT_CARD recurring transactions');
            }
        }
        if (dto.categoryId) {
            await this.categoriesService.validateOwnershipAndType(dto.categoryId, userId, dto.type);
        }
        if (dto.endMonth && dto.endMonth < dto.startMonth) {
            throw new domain_exceptions_1.BusinessRuleException('END_MONTH_BEFORE_START_MONTH', 'endMonth must be equal to or after startMonth');
        }
        return this.recurringRepository.create({
            userId,
            description: dto.description,
            amountCents: BigInt(dto.amountCents),
            type: dto.type,
            startMonth: dto.startMonth,
            endMonth: dto.endMonth,
            dayOfMonth: dto.dayOfMonth,
            categoryId: dto.categoryId,
            paymentMethodId: dto.paymentMethodId,
            notes: dto.notes,
        });
    }
    async generateForMonth(userId, month) {
        const templates = await this.recurringRepository.findActiveForMonth(userId, month);
        let generated = 0;
        let skipped = 0;
        for (const template of templates) {
            const referenceMonth = await this.computeReferenceMonth(template, month);
            const result = await this.transactionsService.createFromRecurring({
                userId,
                recurringTransactionId: template.id,
                categoryId: template.categoryId ?? undefined,
                paymentMethodId: template.paymentMethodId ?? undefined,
                description: template.description,
                amountCents: template.amountCents,
                type: template.type,
                referenceMonth,
                transactionDate: new Date(),
                notes: template.notes ?? undefined,
            });
            if (result === null) {
                skipped++;
            }
            else {
                generated++;
            }
        }
        return { generated, skipped };
    }
    async findAll(userId, filters = {}) {
        return this.recurringRepository.findAllByUser(userId, filters);
    }
    async findActiveForMonth(userId, month) {
        return this.recurringRepository.findActiveForMonth(userId, month);
    }
    async findById(id, userId) {
        const template = await this.recurringRepository.findById(id, userId);
        if (!template)
            throw new domain_exceptions_1.EntityNotFoundException('RecurringTransaction', id);
        return template;
    }
    async update(id, userId, dto) {
        const template = await this.recurringRepository.findById(id, userId);
        if (!template)
            throw new domain_exceptions_1.EntityNotFoundException('RecurringTransaction', id);
        if (dto.categoryId) {
            await this.categoriesService.validateOwnershipAndType(dto.categoryId, userId, template.type);
        }
        if (dto.paymentMethodId) {
            if (template.type === client_1.TransactionType.INCOME) {
                throw new domain_exceptions_1.BusinessRuleException('INCOME_WITH_PAYMENT_METHOD', 'Income recurring transactions cannot have a payment method');
            }
            const pm = await this.paymentMethodsRepository.findById(dto.paymentMethodId, userId);
            if (!pm)
                throw new domain_exceptions_1.EntityNotFoundException('PaymentMethod', dto.paymentMethodId);
        }
        if (dto.endMonth && dto.endMonth < template.startMonth) {
            throw new domain_exceptions_1.BusinessRuleException('END_MONTH_BEFORE_START_MONTH', 'endMonth must be equal to or after startMonth');
        }
        return this.recurringRepository.update(id, {
            ...(dto.description !== undefined ? { description: dto.description } : {}),
            ...(dto.amountCents !== undefined ? { amountCents: BigInt(dto.amountCents) } : {}),
            ...(dto.endMonth !== undefined ? { endMonth: dto.endMonth } : {}),
            ...(dto.dayOfMonth !== undefined ? { dayOfMonth: dto.dayOfMonth } : {}),
            ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
            ...(dto.paymentMethodId !== undefined ? { paymentMethodId: dto.paymentMethodId } : {}),
            ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        });
    }
    async activate(id, userId) {
        const template = await this.recurringRepository.findById(id, userId);
        if (!template)
            throw new domain_exceptions_1.EntityNotFoundException('RecurringTransaction', id);
        return this.recurringRepository.update(id, { isActive: true });
    }
    async deactivate(id, userId) {
        const template = await this.recurringRepository.findById(id, userId);
        if (!template)
            throw new domain_exceptions_1.EntityNotFoundException('RecurringTransaction', id);
        return this.recurringRepository.update(id, { isActive: false });
    }
    async remove(id, userId) {
        const template = await this.recurringRepository.findById(id, userId);
        if (!template)
            throw new domain_exceptions_1.EntityNotFoundException('RecurringTransaction', id);
        await this.recurringRepository.softDelete(id);
    }
    async computeReferenceMonth(template, month) {
        if (template.paymentMethodId &&
            template.dayOfMonth &&
            template.type === client_1.TransactionType.EXPENSE) {
            const pm = await this.paymentMethodsRepository.findById(template.paymentMethodId, template.userId);
            if (pm?.creditCard) {
                const date = this.dayOfMonthToDateInMonth(template.dayOfMonth, month);
                const { referenceMonth } = (0, credit_card_statement_service_1.computeStatementMonth)(pm.creditCard.closingDay, date);
                return referenceMonth;
            }
        }
        return month;
    }
    dayOfMonthToDateInMonth(dayOfMonth, month) {
        const [year, m] = month.split('-').map(Number);
        const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
        const day = Math.min(dayOfMonth, lastDay);
        return new Date(Date.UTC(year, m - 1, day, 12, 0, 0));
    }
};
exports.RecurringService = RecurringService;
exports.RecurringService = RecurringService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [recurring_repository_1.RecurringRepository,
        payment_methods_repository_1.PaymentMethodsRepository,
        categories_service_1.CategoriesService,
        transactions_service_1.TransactionsService])
], RecurringService);
//# sourceMappingURL=recurring.service.js.map