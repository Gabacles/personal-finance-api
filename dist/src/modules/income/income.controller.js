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
exports.IncomeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const public_decorator_1 = require("../../shared/decorators/public.decorator");
const income_service_1 = require("./income.service");
const tax_calculator_service_1 = require("./tax-calculator.service");
const create_income_dto_1 = require("./dto/create-income.dto");
const update_income_dto_1 = require("./dto/update-income.dto");
const estimate_tax_dto_1 = require("./dto/estimate-tax.dto");
let IncomeController = class IncomeController {
    constructor(incomeService, taxCalculatorService) {
        this.incomeService = incomeService;
        this.taxCalculatorService = taxCalculatorService;
    }
    estimate(query) {
        const year = query.year ?? new Date().getUTCFullYear();
        return this.taxCalculatorService.computeCLT(BigInt(query.grossCents), year, query.dependents ?? 0);
    }
    register(user, dto) {
        return this.incomeService.register(user.id, dto);
    }
    findAll(user) {
        return this.incomeService.findAll(user.id);
    }
    findOne(user, id) {
        return this.incomeService.findById(id, user.id);
    }
    update(user, id, dto) {
        return this.incomeService.update(id, user.id, dto);
    }
};
exports.IncomeController = IncomeController;
__decorate([
    (0, common_1.Get)('estimate'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Estimate CLT tax deductions (INSS + IRRF) — public, no auth required',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [estimate_tax_dto_1.EstimateTaxDto]),
    __metadata("design:returntype", void 0)
], IncomeController.prototype, "estimate", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Register income for a reference month' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_income_dto_1.CreateIncomeDto]),
    __metadata("design:returntype", void 0)
], IncomeController.prototype, "register", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'List all income entries' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IncomeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single income entry with deductions' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IncomeController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update income entry gross amount and deductions' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_income_dto_1.UpdateIncomeDto]),
    __metadata("design:returntype", void 0)
], IncomeController.prototype, "update", null);
exports.IncomeController = IncomeController = __decorate([
    (0, swagger_1.ApiTags)('Income'),
    (0, common_1.Controller)('income'),
    __metadata("design:paramtypes", [income_service_1.IncomeService,
        tax_calculator_service_1.TaxCalculatorService])
], IncomeController);
//# sourceMappingURL=income.controller.js.map