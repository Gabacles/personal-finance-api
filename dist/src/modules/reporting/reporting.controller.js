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
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' }),
    __metadata("design:type", String)
], DashboardQueryDto.prototype, "month", void 0);
__decorate([
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