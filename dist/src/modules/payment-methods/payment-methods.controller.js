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
exports.PaymentMethodsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const create_payment_method_dto_1 = require("./dto/create-payment-method.dto");
const payment_methods_service_1 = require("./payment-methods.service");
class PaymentMethodsFilterDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PaymentMethodType),
    __metadata("design:type", String)
], PaymentMethodsFilterDto.prototype, "type", void 0);
let PaymentMethodsController = class PaymentMethodsController {
    constructor(paymentMethodsService) {
        this.paymentMethodsService = paymentMethodsService;
    }
    create(user, dto) {
        return this.paymentMethodsService.create(user.id, dto);
    }
    findAll(user, query) {
        return this.paymentMethodsService.findAll(user.id, query.type);
    }
    findOne(user, id) {
        return this.paymentMethodsService.findById(id, user.id);
    }
};
exports.PaymentMethodsController = PaymentMethodsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Add a new credit card or payment method' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_payment_method_dto_1.CreatePaymentMethodDto]),
    __metadata("design:returntype", void 0)
], PaymentMethodsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'List all payment methods for the authenticated user' }),
    (0, swagger_1.ApiQuery)({ name: 'type', enum: client_1.PaymentMethodType, required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, PaymentMethodsFilterDto]),
    __metadata("design:returntype", void 0)
], PaymentMethodsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single payment method by ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentMethodsController.prototype, "findOne", null);
exports.PaymentMethodsController = PaymentMethodsController = __decorate([
    (0, swagger_1.ApiTags)('Payment Methods'),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.Controller)('payment-methods'),
    __metadata("design:paramtypes", [payment_methods_service_1.PaymentMethodsService])
], PaymentMethodsController);
//# sourceMappingURL=payment-methods.controller.js.map