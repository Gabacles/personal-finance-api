import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
import { IncomeDeductionRepository } from './income-deduction.repository';
import { IncomeController } from './income.controller';
import { IncomeRepository } from './income.repository';
import { IncomeService } from './income.service';
import { TaxCalculatorService } from './tax-calculator.service';

@Module({
  imports: [UsersModule, TransactionsModule, CategoriesModule],
  controllers: [IncomeController],
  providers: [
    IncomeService,
    IncomeRepository,
    IncomeDeductionRepository,
    TaxCalculatorService,
  ],
  exports: [IncomeService],
})
export class IncomeModule {}
