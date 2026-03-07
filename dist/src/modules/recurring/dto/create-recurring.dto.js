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
exports.CreateRecurringDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateRecurringDto {
}
exports.CreateRecurringDto = CreateRecurringDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Netflix', description: 'Description of the recurring transaction' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateRecurringDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4990, description: 'Amount in cents' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateRecurringDto.prototype, "amountCents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.TransactionType, description: 'EXPENSE or INCOME' }),
    (0, class_validator_1.IsEnum)(client_1.TransactionType),
    __metadata("design:type", String)
], CreateRecurringDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-03', description: 'Month when recurrence begins (YYYY-MM)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRecurringDto.prototype, "startMonth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-12', description: 'Month when recurrence ends, inclusive (YYYY-MM). Omit for no end.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRecurringDto.prototype, "endMonth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10, description: 'Day of month used for CREDIT_CARD statement month computation' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(31),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateRecurringDto.prototype, "dayOfMonth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid', description: 'Category ID (must match transaction type)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRecurringDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid', description: 'Payment method ID (must be null for INCOME)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRecurringDto.prototype, "paymentMethodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Monthly streaming subscription' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRecurringDto.prototype, "notes", void 0);
//# sourceMappingURL=create-recurring.dto.js.map