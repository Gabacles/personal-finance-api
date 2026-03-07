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
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const credit_card_statement_service_1 = require("../payment-methods/credit-card-statement.service");
const domain_exceptions_1 = require("../../shared/exceptions/domain.exceptions");
const payment_methods_repository_1 = require("../payment-methods/payment-methods.repository");
const categories_service_1 = require("../categories/categories.service");
const transactions_service_1 = require("../transactions/transactions.service");
let PurchasesService = class PurchasesService {
    constructor(paymentMethodsRepository, categoriesService, transactionsService) {
        this.paymentMethodsRepository = paymentMethodsRepository;
        this.categoriesService = categoriesService;
        this.transactionsService = transactionsService;
    }
    async create(userId, dto) {
        const paymentMethod = await this.paymentMethodsRepository.findById(dto.paymentMethodId, userId);
        if (!paymentMethod) {
            throw new domain_exceptions_1.EntityNotFoundException('PaymentMethod', dto.paymentMethodId);
        }
        if (paymentMethod.type !== client_1.PaymentMethodType.CREDIT_CARD) {
            throw new domain_exceptions_1.BusinessRuleException('PAYMENT_METHOD_NOT_CREDIT_CARD', 'Purchases can only be made with a CREDIT_CARD payment method');
        }
        if (!paymentMethod.creditCard) {
            throw new domain_exceptions_1.BusinessRuleException('CREDIT_CARD_MISSING', 'The credit card details are missing for this payment method');
        }
        if (dto.categoryId) {
            await this.categoriesService.validateOwnershipAndType(dto.categoryId, userId, client_1.TransactionType.EXPENSE);
        }
        const purchaseDate = new Date(dto.purchaseDate);
        const today = new Date();
        today.setUTCHours(23, 59, 59, 999);
        if (purchaseDate > today) {
            throw new domain_exceptions_1.BusinessRuleException('FUTURE_PURCHASE_DATE', 'Purchase date cannot be in the future');
        }
        const { referenceMonth } = (0, credit_card_statement_service_1.computeStatementMonth)(paymentMethod.creditCard.closingDay, purchaseDate);
        return this.transactionsService.createExpense({
            userId,
            categoryId: dto.categoryId,
            paymentMethodId: dto.paymentMethodId,
            description: dto.description,
            amountCents: BigInt(dto.amountCents),
            referenceMonth,
            transactionDate: purchaseDate,
            notes: dto.notes,
        });
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [payment_methods_repository_1.PaymentMethodsRepository,
        categories_service_1.CategoriesService,
        transactions_service_1.TransactionsService])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map