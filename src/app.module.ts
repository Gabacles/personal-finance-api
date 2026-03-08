import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { envValidationSchema } from './shared/config/env.validation';
import { DatabaseModule } from './shared/database/database.module';
import { GlobalExceptionFilter } from './shared/exceptions/global-exception.filter';
import { ResponseEnvelopeInterceptor } from './shared/interceptors/response-envelope.interceptor';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { InstallmentsModule } from './modules/installments/installments.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { RecurringModule } from './modules/recurring/recurring.module';
import { IncomeModule } from './modules/income/income.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    PaymentMethodsModule,
    TransactionsModule,
    PurchasesModule,
    InstallmentsModule,
    RecurringModule,
    IncomeModule,
    ReportingModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
  ],
})
export class AppModule {}

