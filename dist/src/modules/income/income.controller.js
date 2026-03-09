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
    async remove(user, id) {
        await this.incomeService.remove(id, user.id);
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
    (0, swagger_1.ApiOkResponse)({
        description: 'Tax estimation for a gross salary.',
        schema: {
            type: 'object',
            properties: {
                grossCents: { type: 'number', example: 750000 },
                inssCents: { type: 'number', example: 85150 },
                irrfCents: { type: 'number', example: 82619 },
                dependentAllowanceTotalCents: { type: 'number', example: 0 },
                netCents: { type: 'number', example: 582231 },
                inssSlices: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            rateBps: { type: 'number', example: 750 },
                            appliedToCents: { type: 'number', example: 162100 },
                            contributionCents: { type: 'number', example: 12157 },
                        },
                    },
                },
                irrfDetail: {
                    type: 'object',
                    properties: {
                        taxableBasisCents: { type: 'number', example: 664850 },
                        rateBps: { type: 'number', example: 2750 },
                        deductionAppliedCents: { type: 'number', example: 90873 },
                        monthlyReductionCents: { type: 'number', example: 9341 },
                        totalCents: { type: 'number', example: 82619 },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Invalid query parameters.' }),
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
    (0, swagger_1.ApiCreatedResponse)({ description: 'Income entry created successfully.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
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
    (0, swagger_1.ApiOkResponse)({ description: 'List of income entries.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
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
    (0, swagger_1.ApiOkResponse)({ description: 'Income entry with deductions.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
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
    (0, swagger_1.ApiOkResponse)({ description: 'Updated income entry.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_income_dto_1.UpdateIncomeDto]),
    __metadata("design:returntype", void 0)
], IncomeController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete an income entry and its linked transaction' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Income entry deleted successfully.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IncomeController.prototype, "remove", null);
exports.IncomeController = IncomeController = __decorate([
    (0, swagger_1.ApiTags)('Income'),
    (0, common_1.Controller)('income'),
    __metadata("design:paramtypes", [income_service_1.IncomeService,
        tax_calculator_service_1.TaxCalculatorService])
], IncomeController);
//# sourceMappingURL=income.controller.js.map