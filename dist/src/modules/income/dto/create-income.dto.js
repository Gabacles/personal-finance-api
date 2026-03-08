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
exports.CreateIncomeDto = exports.CreateDeductionDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateDeductionDto {
}
exports.CreateDeductionDto = CreateDeductionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Plano de saúde', description: 'Deduction description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateDeductionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50000, description: 'Deduction amount in cents' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateDeductionDto.prototype, "amountCents", void 0);
class CreateIncomeDto {
}
exports.CreateIncomeDto = CreateIncomeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-03', description: 'Reference month (YYYY-MM)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncomeDto.prototype, "referenceMonth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 700000, description: 'Gross salary in cents (R$7,000 = 700000)' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateIncomeDto.prototype, "grossCents", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Salário', description: 'Description (default: Salário)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateIncomeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0, description: 'Number of dependents for IRRF deduction (CLT only)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateIncomeDto.prototype, "dependents", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncomeDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [CreateDeductionDto],
        description: 'Additional custom deductions (e.g., health plan, pension)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateDeductionDto),
    __metadata("design:type", Array)
], CreateIncomeDto.prototype, "customDeductions", void 0);
//# sourceMappingURL=create-income.dto.js.map