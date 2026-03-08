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
exports.CreateTransactionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateTransactionDto {
    constructor() {
        this.description = '';
        this.amountCents = 0;
        this.transactionDate = '';
    }
}
exports.CreateTransactionDto = CreateTransactionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Category UUID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Payment method UUID (must not be a credit card)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "paymentMethodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Short description of the expense', example: 'Groceries' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Amount in BRL cents (must be ≥ 1)', example: 5000 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateTransactionDto.prototype, "amountCents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction date in YYYY-MM-DD format', example: '2026-03-07' }),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/, { message: 'transactionDate must be in YYYY-MM-DD format' }),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "transactionDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional free-form notes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "notes", void 0);
//# sourceMappingURL=create-transaction.dto.js.map