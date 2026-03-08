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
exports.BudgetController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const budget_service_1 = require("./budget.service");
const create_budget_dto_1 = require("./dto/create-budget.dto");
const update_budget_dto_1 = require("./dto/update-budget.dto");
let BudgetController = class BudgetController {
    constructor(budgetService) {
        this.budgetService = budgetService;
    }
    create(user, dto) {
        return this.budgetService.create(user.id, dto);
    }
    findAll(user) {
        return this.budgetService.findAll(user.id);
    }
    findOne(user, month) {
        return this.budgetService.findByMonth(user.id, month);
    }
    update(user, month, dto) {
        return this.budgetService.update(user.id, month, dto);
    }
    async remove(user, month) {
        await this.budgetService.remove(user.id, month);
    }
};
exports.BudgetController = BudgetController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a monthly budget with optional allocations' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Budget created successfully.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_budget_dto_1.CreateBudgetDto]),
    __metadata("design:returntype", void 0)
], BudgetController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'List all monthly budgets' }),
    (0, swagger_1.ApiOkResponse)({ description: 'List of user budgets.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BudgetController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':month'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get the budget for a specific month (YYYY-MM)' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Budget for requested month.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BudgetController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':month'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update total budget and/or replace allocations for a month' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Updated budget for requested month.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('month')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_budget_dto_1.UpdateBudgetDto]),
    __metadata("design:returntype", void 0)
], BudgetController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':month'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a monthly budget and all its allocations' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Budget deleted successfully.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BudgetController.prototype, "remove", null);
exports.BudgetController = BudgetController = __decorate([
    (0, swagger_1.ApiTags)('Budgets'),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.Controller)('budgets'),
    __metadata("design:paramtypes", [budget_service_1.BudgetService])
], BudgetController);
//# sourceMappingURL=budget.controller.js.map