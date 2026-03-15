import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiPropertyOptional,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../shared/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { SummaryService } from './summary.service';

class DashboardQueryDto {
  @ApiPropertyOptional({
    description: 'Reference month (YYYY-MM). Defaults to current month.',
    example: '2026-03',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' })
  month?: string;

  @ApiPropertyOptional({
    description: 'How many future months to project (1-12). Defaults to 3.',
    minimum: 1,
    maximum: 12,
    example: 3,
  })
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
  @ApiOkResponse({
    description: 'Monthly financial summary.',
    schema: {
      type: 'object',
      properties: {
        month: { type: 'string', example: '2026-03' },
        recurringGenerated: { type: 'number', example: 2 },
        recurringSkipped: { type: 'number', example: 1 },
        totalGrossCents: { type: 'number', example: 800000 },
        totalNetIncomeCents: {
          type: 'number',
          example: 754044,
          description:
            'Sum of all incomeEntries.netCents (POST /income) and all RECURRING INCOME transactions generated for this month.',
        },
        totalDeductionCents: {
          type: 'number',
          example: 45956,
          description:
            'Total deductions in month. Formula: manualDeductionCents + recurringDeductionCents.',
        },
        manualDeductionCents: {
          type: 'number',
          example: 45956,
          description: 'Only the deductions from manual income entries (/income).',
        },
        recurringDeductionCents: {
          type: 'number',
          example: 167769,
          description:
            'Only the deductions from recurring INCOME templates that apply automatic taxes.',
        },
        totalExpenseCents: { type: 'number', example: 423500 },
        oneTimeCents: { type: 'number', example: 250000 },
        installmentCents: { type: 'number', example: 100000 },
        recurringExpenseCents: { type: 'number', example: 73500 },
        recurringIncomeCents: {
          type: 'number',
          example: 150000,
          description:
            'Sum of RECURRING INCOME transactions generated for this month (from /recurring-transactions templates with type INCOME).',
        },
        balanceCents: { type: 'number', example: 330544 },
        byCategory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryId: { type: 'string', format: 'uuid' },
              categoryName: { type: 'string', example: 'Alimentação' },
              totalCents: { type: 'number', example: 150000 },
            },
          },
        },
        byPaymentMethod: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              paymentMethodId: { type: 'string', format: 'uuid' },
              paymentMethodName: { type: 'string', example: 'Nubank' },
              totalCents: { type: 'number', example: 200000 },
            },
          },
        },
        transactions: { type: 'array', items: { type: 'object' } },
        incomeEntries: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
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
  @ApiOkResponse({
    description: 'Dashboard with current month and projections.',
    schema: {
      type: 'object',
      properties: {
        currentMonth: {
          type: 'object',
          description: 'Full MonthlySummary for the requested month — same shape as GET /summary/:month.',
          properties: {
            month: { type: 'string', example: '2026-03' },
            recurringGenerated: { type: 'number', example: 2 },
            recurringSkipped: { type: 'number', example: 0 },
            totalGrossCents: { type: 'number', example: 800000 },
            totalNetIncomeCents: {
              type: 'number',
              example: 754044,
              description:
                'sum(incomeEntries.netCents) + recurringIncomeCents, where recurringIncomeCents uses net amounts when recurring template has applyTaxDeductions=true for CLT users.',
            },
            totalDeductionCents: {
              type: 'number',
              example: 45956,
              description:
                'Total deductions in month. Formula: manualDeductionCents + recurringDeductionCents.',
            },
            manualDeductionCents: {
              type: 'number',
              example: 45956,
              description: 'Only the deductions from manual income entries (/income).',
            },
            recurringDeductionCents: {
              type: 'number',
              example: 167769,
              description:
                'Only the deductions from recurring INCOME templates that apply automatic taxes.',
            },
            totalExpenseCents: { type: 'number', example: 423500 },
            oneTimeCents: { type: 'number', example: 250000 },
            installmentCents: { type: 'number', example: 100000 },
            recurringExpenseCents: { type: 'number', example: 73500 },
            recurringIncomeCents: {
              type: 'number',
              example: 150000,
              description: 'RECURRING INCOME transactions generated for this month.',
            },
            balanceCents: { type: 'number', example: 330544 },
            byCategory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  categoryId: { type: 'string', format: 'uuid' },
                  categoryName: { type: 'string' },
                  totalCents: { type: 'number' },
                },
              },
            },
            byPaymentMethod: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  paymentMethodId: { type: 'string', format: 'uuid' },
                  paymentMethodName: { type: 'string' },
                  totalCents: { type: 'number' },
                },
              },
            },
            transactions: { type: 'array', items: { type: 'object' } },
            incomeEntries: { type: 'array', items: { type: 'object' } },
          },
        },
        projections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'string', example: '2026-04' },
              confidence: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'], example: 'HIGH' },
              projectedExpenseCents: { type: 'number', example: 350000 },
              projectedIncomeCents: { type: 'number', example: 500000 },
              projectedBalanceCents: { type: 'number', example: 150000 },
              breakdown: {
                type: 'object',
                properties: {
                  installmentCents: { type: 'number', example: 100000 },
                  oneTimeCents: { type: 'number', example: 50000 },
                  recurringExpenseCents: { type: 'number', example: 200000 },
                  recurringIncomeCents: {
                    type: 'number',
                    example: 300000,
                    description:
                      'Projected recurring income from active templates for this month. For CLT users, templates with applyTaxDeductions=true are projected as net amounts.',
                  },
                  committedIncomeCents: {
                    type: 'number',
                    example: 200000,
                    description:
                      'Income entries already created for this future month (sum of incomeEntries.netCents).',
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  getDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DashboardQueryDto,
  ) {
    const month = query.month ?? currentMonth();
    return this.dashboardService.get(user.id, month, query.projectionMonths ?? 3);
  }
}
