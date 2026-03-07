import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { RecurringController } from './recurring.controller';
import { RecurringRepository } from './recurring.repository';
import { RecurringService } from './recurring.service';

@Module({
  imports: [PaymentMethodsModule, CategoriesModule, TransactionsModule],
  controllers: [RecurringController],
  providers: [RecurringService, RecurringRepository],
  exports: [RecurringService],
})
export class RecurringModule {}
