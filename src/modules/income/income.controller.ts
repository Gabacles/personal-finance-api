import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { IncomeService } from './income.service';
import { TaxCalculatorService } from './tax-calculator.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { EstimateTaxDto } from './dto/estimate-tax.dto';
import { QueryIncomeDto } from './dto/query-income.dto';

const incomeDeductionSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    incomeEntryId: { type: 'string', format: 'uuid' },
    description: { type: 'string', example: 'INSS' },
    amountCents: { type: 'number', example: 85150 },
    isAutomatic: { type: 'boolean', example: true },
    deductionType: { type: 'string', nullable: true, example: 'INSS' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const incomeEntrySchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    referenceMonth: { type: 'string', example: '2026-03' },
    grossCents: { type: 'number', example: 800000 },
    netCents: { type: 'number', example: 582231 },
    employmentType: { type: 'string', enum: ['CLT', 'PJ', 'OTHER'] },
    description: { type: 'string', example: 'Salário' },
    notes: { type: 'string', nullable: true, example: 'Bônus incluso' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true },
    deductions: {
      type: 'array',
      items: incomeDeductionSchema,
    },
  },
};

const incomeEstimateSchema = {
  type: 'object',
  properties: {
    grossCents: { type: 'number', example: 750000 },
    inssCents: { type: 'number', example: 85150 },
    irrfCents: { type: 'number', example: 82619 },
    dependentAllowanceTotalCents: { type: 'number', example: 0 },
    netCents: { type: 'number', example: 582231 },
    inssSlices: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rateBps: { type: 'number', example: 750 },
          appliedToCents: { type: 'number', example: 162100 },
          contributionCents: { type: 'number', example: 12157 },
        },
      },
    },
    irrfDetail: {
      type: 'object',
      properties: {
        taxableBasisCents: { type: 'number', example: 664850 },
        rateBps: { type: 'number', example: 2750 },
        deductionAppliedCents: { type: 'number', example: 90873 },
        monthlyReductionCents: { type: 'number', example: 9341 },
        totalCents: { type: 'number', example: 82619 },
      },
    },
  },
};

const incomeEstimateEnvelopeSchema = {
  type: 'object',
  properties: {
    data: incomeEstimateSchema,
  },
};

const incomeEntryEnvelopeSchema = {
  type: 'object',
  properties: {
    data: incomeEntrySchema,
  },
};

const incomeEntryListEnvelopeSchema = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: incomeEntrySchema,
        },
        total: { type: 'number', example: 42 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  },
};

@ApiTags('Income')
@Controller('income')
export class IncomeController {
  constructor(
    private readonly incomeService: IncomeService,
    private readonly taxCalculatorService: TaxCalculatorService,
  ) {}

  @Get('estimate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Estimate CLT tax deductions (INSS + IRRF) — public, no auth required',
  })
  @ApiOkResponse({
    description: 'Tax estimation for a gross salary.',
    schema: incomeEstimateEnvelopeSchema,
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters.' })
  estimate(@Query() query: EstimateTaxDto) {
    const year = query.year ?? new Date().getUTCFullYear();
    return this.taxCalculatorService.computeCLT(
      BigInt(query.grossCents),
      year,
      query.dependents ?? 0,
    );
  }

  @Post()
  @ApiBearerAuth('jwt')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a manual income entry for a reference month',
    description:
      'Allows multiple income entries in the same month (e.g., salary + freelance + bonus).',
  })
  @ApiCreatedResponse({
    description: 'Income entry created successfully.',
    schema: incomeEntryEnvelopeSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  register(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIncomeDto,
  ) {
    return this.incomeService.register(user.id, dto);
  }

  @Get()
  @ApiBearerAuth('jwt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all income entries with pagination',
    description:
      'Returns all non-deleted income entries for the authenticated user, including deductions.',
  })
  @ApiQuery({
    name: 'referenceMonth',
    type: String,
    required: false,
    example: '2026-03',
    description: 'Filter entries by reference month (YYYY-MM).',
  })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiOkResponse({
    description:
      'Paginated list of income entries (multiple entries may exist for the same month).',
    schema: incomeEntryListEnvelopeSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryIncomeDto,
  ) {
    return this.incomeService.findAll(user.id, {
      referenceMonth: query.referenceMonth,
    }, {
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  @ApiBearerAuth('jwt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single income entry with deductions' })
  @ApiOkResponse({
    description: 'Income entry with deductions.',
    schema: incomeEntryEnvelopeSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.incomeService.findById(id, user.id);
  }

  @Patch(':id')
  @ApiBearerAuth('jwt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update income entry',
    description:
      'Updates gross amount, deductions, description, and notes. ' +
      'The linked INCOME transaction in the ledger is also updated (net amount, description, notes).',
  })
  @ApiOkResponse({
    description: 'Updated income entry with recomputed deductions.',
    schema: incomeEntryEnvelopeSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncomeDto,
  ) {
    return this.incomeService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('jwt')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an income entry and its linked transaction' })
  @ApiNoContentResponse({ description: 'Income entry deleted successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.incomeService.remove(id, user.id);
  }
}
