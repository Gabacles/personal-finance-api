import { Module } from '@nestjs/common';
import { TaxCalculatorService } from '../income/tax-calculator.service';
import { RecurringModule } from '../recurring/recurring.module';
import { UsersModule } from '../users/users.module';
import { DashboardService } from './dashboard.service';
import { ReportingController } from './reporting.controller';
import { SummaryService } from './summary.service';

@Module({
  imports: [RecurringModule, UsersModule],
  controllers: [ReportingController],
  providers: [SummaryService, DashboardService, TaxCalculatorService],
  exports: [SummaryService],
})
export class ReportingModule {}
