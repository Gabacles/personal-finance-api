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
exports.CreateInstallmentPlanDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateInstallmentPlanDto {
}
exports.CreateInstallmentPlanDto = CreateInstallmentPlanDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Credit card payment method ID (must be CREDIT_CARD)', format: 'uuid' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateInstallmentPlanDto.prototype, "paymentMethodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateInstallmentPlanDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MacBook Pro 16"', maxLength: 255 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateInstallmentPlanDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total purchase amount in cents', minimum: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateInstallmentPlanDto.prototype, "totalAmountCents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of installments (minimum 2)', minimum: 2 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2),
    __metadata("design:type", Number)
], CreateInstallmentPlanDto.prototype, "installmentCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-03-05', description: 'Purchase date (YYYY-MM-DD), must not be in the future' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateInstallmentPlanDto.prototype, "purchaseDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateInstallmentPlanDto.prototype, "notes", void 0);
//# sourceMappingURL=create-installment-plan.dto.js.map