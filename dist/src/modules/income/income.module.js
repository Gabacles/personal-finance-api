"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomeModule = void 0;
const common_1 = require("@nestjs/common");
const transactions_module_1 = require("../transactions/transactions.module");
const users_module_1 = require("../users/users.module");
const income_deduction_repository_1 = require("./income-deduction.repository");
const income_controller_1 = require("./income.controller");
const income_repository_1 = require("./income.repository");
const income_service_1 = require("./income.service");
const tax_calculator_service_1 = require("./tax-calculator.service");
let IncomeModule = class IncomeModule {
};
exports.IncomeModule = IncomeModule;
exports.IncomeModule = IncomeModule = __decorate([
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule, transactions_module_1.TransactionsModule],
        controllers: [income_controller_1.IncomeController],
        providers: [
            income_service_1.IncomeService,
            income_repository_1.IncomeRepository,
            income_deduction_repository_1.IncomeDeductionRepository,
            tax_calculator_service_1.TaxCalculatorService,
        ],
        exports: [income_service_1.IncomeService],
    })
], IncomeModule);
//# sourceMappingURL=income.module.js.map