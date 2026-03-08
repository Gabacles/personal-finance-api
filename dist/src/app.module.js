"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const env_validation_1 = require("./shared/config/env.validation");
const database_module_1 = require("./shared/database/database.module");
const global_exception_filter_1 = require("./shared/exceptions/global-exception.filter");
const response_envelope_interceptor_1 = require("./shared/interceptors/response-envelope.interceptor");
const health_module_1 = require("./health/health.module");
const auth_module_1 = require("./modules/auth/auth.module");
const categories_module_1 = require("./modules/categories/categories.module");
const installments_module_1 = require("./modules/installments/installments.module");
const payment_methods_module_1 = require("./modules/payment-methods/payment-methods.module");
const purchases_module_1 = require("./modules/purchases/purchases.module");
const recurring_module_1 = require("./modules/recurring/recurring.module");
const income_module_1 = require("./modules/income/income.module");
const reporting_module_1 = require("./modules/reporting/reporting.module");
const budget_module_1 = require("./modules/budget/budget.module");
const transactions_module_1 = require("./modules/transactions/transactions.module");
const users_module_1 = require("./modules/users/users.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: env_validation_1.envValidationSchema,
                validationOptions: { abortEarly: false },
            }),
            database_module_1.DatabaseModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            categories_module_1.CategoriesModule,
            payment_methods_module_1.PaymentMethodsModule,
            transactions_module_1.TransactionsModule,
            purchases_module_1.PurchasesModule,
            installments_module_1.InstallmentsModule,
            recurring_module_1.RecurringModule,
            income_module_1.IncomeModule,
            reporting_module_1.ReportingModule,
            budget_module_1.BudgetModule,
        ],
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: global_exception_filter_1.GlobalExceptionFilter,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: response_envelope_interceptor_1.ResponseEnvelopeInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map