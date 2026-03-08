import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../shared/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { SummaryService } from './summary.service';

class DashboardQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' })
  month?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  projectionMonths?: number;
}

function currentMonth(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

@ApiTags('Reporting')
@ApiBearerAuth('jwt')
@Controller()
export class ReportingController {
  constructor(
    private readonly summaryService: SummaryService,
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('summary/:month')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get aggregated financial summary for a given month (YYYY-MM)' })
  getMonthSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('month') month: string,
  ) {
    return this.summaryService.getForMonth(user.id, month);
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current month summary plus multi-month projections',
  })
  @ApiQuery({ name: 'month', required: false, description: 'Reference month (YYYY-MM). Defaults to current month.' })
  @ApiQuery({ name: 'projectionMonths', required: false, description: 'How many future months to project (1–12). Defaults to 3.' })
  getDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DashboardQueryDto,
  ) {
    const month = query.month ?? currentMonth();
    return this.dashboardService.get(user.id, month, query.projectionMonths ?? 3);
  }
}
