import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { InstallmentsController } from './installments.controller';
import { InstallmentsRepository } from './installments.repository';
import { InstallmentsService } from './installments.service';

@Module({
  imports: [PaymentMethodsModule, CategoriesModule, TransactionsModule],
  controllers: [InstallmentsController],
  providers: [InstallmentsService, InstallmentsRepository],
  exports: [InstallmentsService],
})
export class InstallmentsModule {}
