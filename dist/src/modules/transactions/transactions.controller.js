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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const create_transaction_dto_1 = require("./dto/create-transaction.dto");
const query_transactions_dto_1 = require("./dto/query-transactions.dto");
const update_transaction_dto_1 = require("./dto/update-transaction.dto");
const transactions_service_1 = require("./transactions.service");
let TransactionsController = class TransactionsController {
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    create(user, dto) {
        return this.transactionsService.createDirectExpense(user.id, dto);
    }
    findAll(user, query) {
        const pagination = { page: query.page, limit: query.limit };
        const filters = {
            type: query.type,
            origin: query.origin,
            referenceMonth: query.reference_month,
            paymentMethodId: query.payment_method_id,
            categoryId: query.category_id,
        };
        return this.transactionsService.findByFilters(user.id, filters, pagination);
    }
    findOne(user, id) {
        return this.transactionsService.findById(id, user.id);
    }
    update(user, id, dto) {
        return this.transactionsService.update(id, user.id, dto);
    }
    async remove(user, id) {
        await this.transactionsService.remove(id, user.id);
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a direct one-time expense (non-credit-card)' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'One-time transaction created successfully.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_transaction_dto_1.CreateTransactionDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'List transactions with optional filters and pagination' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Paginated transactions list.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_transactions_dto_1.QueryTransactionsDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single transaction by ID' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Transaction details.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update a one-time transaction (description, amount, notes, category)' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Updated one-time transaction.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_transaction_dto_1.UpdateTransactionDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete a one-time transaction' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Transaction deleted successfully.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "remove", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, swagger_1.ApiTags)('Transactions'),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.Controller)('transactions'),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map