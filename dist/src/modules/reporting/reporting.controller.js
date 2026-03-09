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
exports.ReportingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const dashboard_service_1 = require("./dashboard.service");
const summary_service_1 = require("./summary.service");
class DashboardQueryDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Reference month (YYYY-MM). Defaults to current month.',
        example: '2026-03',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' }),
    __metadata("design:type", String)
], DashboardQueryDto.prototype, "month", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'How many future months to project (1-12). Defaults to 3.',
        minimum: 1,
        maximum: 12,
        example: 3,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], DashboardQueryDto.prototype, "projectionMonths", void 0);
function currentMonth() {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
}
let ReportingController = class ReportingController {
    constructor(summaryService, dashboardService) {
        this.summaryService = summaryService;
        this.dashboardService = dashboardService;
    }
    getMonthSummary(user, month) {
        return this.summaryService.getForMonth(user.id, month);
    }
    getDashboard(user, query) {
        const month = query.month ?? currentMonth();
        return this.dashboardService.get(user.id, month, query.projectionMonths ?? 3);
    }
};
exports.ReportingController = ReportingController;
__decorate([
    (0, common_1.Get)('summary/:month'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get aggregated financial summary for a given month (YYYY-MM)' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Monthly financial summary.',
        schema: {
            type: 'object',
            properties: {
                month: { type: 'string', example: '2026-03' },
                recurringGenerated: { type: 'number', example: 2 },
                recurringSkipped: { type: 'number', example: 1 },
                totalGrossCents: { type: 'number', example: 800000 },
                totalNetIncomeCents: {
                    type: 'number',
                    example: 754044,
                    description: 'Sum of incomeEntry.netCents (POST /income) and all RECURRING INCOME transactions generated for this month.',
                },
                totalDeductionCents: { type: 'number', example: 45956 },
                totalExpenseCents: { type: 'number', example: 423500 },
                oneTimeCents: { type: 'number', example: 250000 },
                installmentCents: { type: 'number', example: 100000 },
                recurringExpenseCents: { type: 'number', example: 73500 },
                recurringIncomeCents: {
                    type: 'number',
                    example: 150000,
                    description: 'Sum of RECURRING INCOME transactions generated for this month (from /recurring-transactions templates with type INCOME).',
                },
                balanceCents: { type: 'number', example: 330544 },
                byCategory: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            categoryId: { type: 'string', format: 'uuid' },
                            categoryName: { type: 'string', example: 'Alimentação' },
                            totalCents: { type: 'number', example: 150000 },
                        },
                    },
                },
                byPaymentMethod: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            paymentMethodId: { type: 'string', format: 'uuid' },
                            paymentMethodName: { type: 'string', example: 'Nubank' },
                            totalCents: { type: 'number', example: 200000 },
                        },
                    },
                },
                transactions: { type: 'array', items: { type: 'object' } },
                incomeEntry: { type: 'object', nullable: true },
            },
        },
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getMonthSummary", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Get current month summary plus multi-month projections',
    }),
    (0, swagger_1.ApiQuery)({ name: 'month', required: false, description: 'Reference month (YYYY-MM). Defaults to current month.' }),
    (0, swagger_1.ApiQuery)({ name: 'projectionMonths', required: false, description: 'How many future months to project (1–12). Defaults to 3.' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Dashboard with current month and projections.',
        schema: {
            type: 'object',
            properties: {
                currentMonth: {
                    type: 'object',
                    description: 'Full MonthlySummary for the requested month — same shape as GET /summary/:month.',
                    properties: {
                        month: { type: 'string', example: '2026-03' },
                        recurringGenerated: { type: 'number', example: 2 },
                        recurringSkipped: { type: 'number', example: 0 },
                        totalGrossCents: { type: 'number', example: 800000 },
                        totalNetIncomeCents: {
                            type: 'number',
                            example: 754044,
                            description: 'incomeEntry.netCents + recurringIncomeCents',
                        },
                        totalDeductionCents: { type: 'number', example: 45956 },
                        totalExpenseCents: { type: 'number', example: 423500 },
                        oneTimeCents: { type: 'number', example: 250000 },
                        installmentCents: { type: 'number', example: 100000 },
                        recurringExpenseCents: { type: 'number', example: 73500 },
                        recurringIncomeCents: {
                            type: 'number',
                            example: 150000,
                            description: 'RECURRING INCOME transactions generated for this month.',
                        },
                        balanceCents: { type: 'number', example: 330544 },
                        byCategory: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    categoryId: { type: 'string', format: 'uuid' },
                                    categoryName: { type: 'string' },
                                    totalCents: { type: 'number' },
                                },
                            },
                        },
                        byPaymentMethod: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    paymentMethodId: { type: 'string', format: 'uuid' },
                                    paymentMethodName: { type: 'string' },
                                    totalCents: { type: 'number' },
                                },
                            },
                        },
                        transactions: { type: 'array', items: { type: 'object' } },
                        incomeEntry: { type: 'object', nullable: true },
                    },
                },
                projections: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            month: { type: 'string', example: '2026-04' },
                            confidence: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'], example: 'HIGH' },
                            projectedExpenseCents: { type: 'number', example: 350000 },
                            projectedIncomeCents: { type: 'number', example: 500000 },
                            projectedBalanceCents: { type: 'number', example: 150000 },
                            breakdown: {
                                type: 'object',
                                properties: {
                                    installmentCents: { type: 'number', example: 100000 },
                                    oneTimeCents: { type: 'number', example: 50000 },
                                    recurringExpenseCents: { type: 'number', example: 200000 },
                                    recurringIncomeCents: { type: 'number', example: 300000 },
                                    committedIncomeCents: { type: 'number', example: 200000 },
                                },
                            },
                        },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, DashboardQueryDto]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "getDashboard", null);
exports.ReportingController = ReportingController = __decorate([
    (0, swagger_1.ApiTags)('Reporting'),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [summary_service_1.SummaryService,
        dashboard_service_1.DashboardService])
], ReportingController);
//# sourceMappingURL=reporting.controller.js.map