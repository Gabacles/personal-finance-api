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
exports.CreatePaymentMethodDto = exports.CreateCreditCardDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateCreditCardDto {
    constructor() {
        this.closingDay = 0;
        this.dueDay = 0;
    }
}
exports.CreateCreditCardDto = CreateCreditCardDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Day of month the card closes (1–31)', example: 20 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(31),
    __metadata("design:type", Number)
], CreateCreditCardDto.prototype, "closingDay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Day of month the payment is due (1–31)', example: 27 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(31),
    __metadata("design:type", Number)
], CreateCreditCardDto.prototype, "dueDay", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Credit limit in BRL cents', example: 500000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCreditCardDto.prototype, "creditLimitCents", void 0);
class CreatePaymentMethodDto {
    constructor() {
        this.name = '';
        this.type = client_1.PaymentMethodType.CREDIT_CARD;
    }
}
exports.CreatePaymentMethodDto = CreatePaymentMethodDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Nubank Roxinho' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentMethodDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.PaymentMethodType, example: client_1.PaymentMethodType.CREDIT_CARD }),
    (0, class_validator_1.IsEnum)(client_1.PaymentMethodType),
    __metadata("design:type", String)
], CreatePaymentMethodDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: CreateCreditCardDto }),
    (0, class_validator_1.ValidateIf)((o) => o.type === client_1.PaymentMethodType.CREDIT_CARD),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CreateCreditCardDto),
    __metadata("design:type", CreateCreditCardDto)
], CreatePaymentMethodDto.prototype, "creditCard", void 0);
//# sourceMappingURL=create-payment-method.dto.js.map