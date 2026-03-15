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
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../shared/decorators/current-user.decorator';
import { RecurringService } from './recurring.service';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { QueryRecurringDto } from './dto/query-recurring.dto';

const recurringTransactionSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    categoryId: { type: 'string', format: 'uuid', nullable: true },
    paymentMethodId: { type: 'string', format: 'uuid', nullable: true },
    description: { type: 'string', example: 'Netflix' },
    amountCents: { type: 'number', example: 3990 },
    type: { type: 'string', enum: ['EXPENSE', 'INCOME'] },
    dayOfMonth: { type: 'number', nullable: true, example: 5 },
    startMonth: { type: 'string', example: '2026-01' },
    endMonth: { type: 'string', nullable: true, example: '2026-12' },
    isActive: { type: 'boolean', example: true },
    applyTaxDeductions: { type: 'boolean', example: false },
    dependents: { type: 'number', example: 0 },
    notes: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

const recurringTransactionReadSchema = {
  allOf: [
    recurringTransactionSchema,
    {
      type: 'object',
      properties: {
        amountCents: {
          type: 'number',
          example: 582231,
          description:
            'Effective amount returned by read endpoints. For INCOME templates with applyTaxDeductions=true and CLT users, this value is net (after INSS/IRRF).',
        },
        grossAmountCents: {
          type: 'number',
          nullable: true,
          example: 750000,
          description:
            'Only for INCOME templates. Original configured amount before automatic deductions.',
        },
        netAmountCents: {
          type: 'number',
          nullable: true,
          example: 582231,
          description:
            'Only for INCOME templates. Effective net amount used in read responses.',
        },
        deductionCents: {
          type: 'number',
          nullable: true,
          example: 167769,
          description:
            'Only for INCOME templates. grossAmountCents - netAmountCents.',
        },
        taxBreakdown: {
          type: 'object',
          nullable: true,
          description:
            'Detailed tax preview for INCOME templates when automatic deductions apply for CLT users.',
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
        },
      },
    },
  ],
};

const recurringTransactionEnvelopeSchema = {
  type: 'object',
  properties: {
    data: recurringTransactionSchema,
  },
};

const recurringTransactionListEnvelopeSchema = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: recurringTransactionReadSchema,
        },
        total: { type: 'number', example: 42 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  },
};

const recurringTransactionReadEnvelopeSchema = {
  type: 'object',
  properties: {
    data: recurringTransactionReadSchema,
  },
};

@ApiTags('Recurring Transactions')
@ApiBearerAuth('jwt')
@Controller('recurring-transactions')
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a recurring transaction template' })
  @ApiCreatedResponse({
    description: 'Recurring transaction created successfully.',
    schema: recurringTransactionEnvelopeSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRecurringDto,
  ) {
    return this.recurringService.create(user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List recurring transaction templates with pagination' })
  @ApiQuery({ name: 'type', enum: TransactionType, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiOkResponse({
    description: 'Paginated list of recurring transaction templates.',
    schema: recurringTransactionListEnvelopeSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryRecurringDto,
  ) {
    return this.recurringService.findAll(
      user.id,
      { type: query.type, isActive: query.isActive },
      { page: query.page, limit: query.limit },
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single recurring transaction template' })
  @ApiOkResponse({
    description: 'Recurring transaction template details.',
    schema: recurringTransactionReadEnvelopeSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recurringService.findById(id, user.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a recurring transaction template',
    description:
      'Updates the template and propagates changes (description, categoryId, paymentMethodId, notes, amountCents) ' +
      'to already-materialized RECURRING transactions from the current month onwards. Past months are preserved.',
  })
  @ApiOkResponse({
    description: 'Updated recurring transaction template.',
    schema: recurringTransactionEnvelopeSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecurringDto,
  ) {
    return this.recurringService.update(id, user.id, dto);
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a recurring transaction template' })
  @ApiOkResponse({
    description: 'Recurring transaction template activated.',
    schema: recurringTransactionEnvelopeSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recurringService.activate(id, user.id);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a recurring transaction template' })
  @ApiOkResponse({
    description: 'Recurring transaction template deactivated.',
    schema: recurringTransactionEnvelopeSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  deactivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recurringService.deactivate(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a recurring transaction template' })
  @ApiNoContentResponse({ description: 'Recurring transaction template deleted.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recurringService.remove(id, user.id);
  }
}
