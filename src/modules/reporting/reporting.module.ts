import { Module } from '@nestjs/common';
import { RecurringModule } from '../recurring/recurring.module';
import { DashboardService } from './dashboard.service';
import { ReportingController } from './reporting.controller';
import { SummaryService } from './summary.service';

@Module({
  imports: [RecurringModule],
  controllers: [ReportingController],
  providers: [SummaryService, DashboardService],
  exports: [SummaryService],
})
export class ReportingModule {}
