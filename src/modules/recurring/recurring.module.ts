import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
import { TaxCalculatorService } from '../income/tax-calculator.service';
import { RecurringController } from './recurring.controller';
import { RecurringRepository } from './recurring.repository';
import { RecurringService } from './recurring.service';

@Module({
  imports: [PaymentMethodsModule, CategoriesModule, TransactionsModule, UsersModule],
  controllers: [RecurringController],
  providers: [RecurringService, RecurringRepository, TaxCalculatorService],
  exports: [RecurringService],
})
export class RecurringModule {}
