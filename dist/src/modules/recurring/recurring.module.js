"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringModule = void 0;
const common_1 = require("@nestjs/common");
const categories_module_1 = require("../categories/categories.module");
const payment_methods_module_1 = require("../payment-methods/payment-methods.module");
const transactions_module_1 = require("../transactions/transactions.module");
const users_module_1 = require("../users/users.module");
const tax_calculator_service_1 = require("../income/tax-calculator.service");
const recurring_controller_1 = require("./recurring.controller");
const recurring_repository_1 = require("./recurring.repository");
const recurring_service_1 = require("./recurring.service");
let RecurringModule = class RecurringModule {
};
exports.RecurringModule = RecurringModule;
exports.RecurringModule = RecurringModule = __decorate([
    (0, common_1.Module)({
        imports: [payment_methods_module_1.PaymentMethodsModule, categories_module_1.CategoriesModule, transactions_module_1.TransactionsModule, users_module_1.UsersModule],
        controllers: [recurring_controller_1.RecurringController],
        providers: [recurring_service_1.RecurringService, recurring_repository_1.RecurringRepository, tax_calculator_service_1.TaxCalculatorService],
        exports: [recurring_service_1.RecurringService],
    })
], RecurringModule);
//# sourceMappingURL=recurring.module.js.map