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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../shared/decorators/current-user.decorator';
import { PaginationDto } from '../../shared/pagination/pagination.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';

const categorySchema = {
  type: 'object',
  nullable: true,
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid', nullable: true },
    name: { type: 'string', example: 'Supermercado' },
    type: { type: 'string', enum: ['EXPENSE', 'INCOME'] },
    isSystem: { type: 'boolean', example: false },
    createdAt: { type: 'string', format: 'date-time' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

const creditCardSchema = {
  type: 'object',
  nullable: true,
  properties: {
    id: { type: 'string', format: 'uuid' },
    paymentMethodId: { type: 'string', format: 'uuid' },
    closingDay: { type: 'number', example: 3 },
    dueDay: { type: 'number', example: 10 },
    creditLimitCents: { type: 'number', nullable: true, example: 500000 },
  },
};

const paymentMethodSchema = {
  type: 'object',
  nullable: true,
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    name: { type: 'string', example: 'Nubank' },
    type: {
      type: 'string',
      enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'CASH', 'OTHER'],
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true },
    creditCard: creditCardSchema,
  },
};

const installmentPlanSchema = {
  type: 'object',
  nullable: true,
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    paymentMethodId: { type: 'string', format: 'uuid' },
    categoryId: { type: 'string', format: 'uuid', nullable: true },
    description: { type: 'string', example: 'iPhone 16' },
    totalAmountCents: { type: 'number', example: 420000 },
    installmentCount: { type: 'number', example: 12 },
    firstReferenceMonth: { type: 'string', example: '2026-04' },
    status: {
      type: 'string',
      enum: ['ACTIVE', 'CANCELLED', 'COMPLETED'],
    },
    purchaseDate: { type: 'string', format: 'date-time' },
    notes: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

const transactionSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    categoryId: { type: 'string', format: 'uuid', nullable: true },
    paymentMethodId: { type: 'string', format: 'uuid', nullable: true },
    installmentPlanId: { type: 'string', format: 'uuid', nullable: true },
    recurringTransactionId: { type: 'string', format: 'uuid', nullable: true },
    incomeEntryId: { type: 'string', format: 'uuid', nullable: true },
    description: { type: 'string', example: 'Supermercado' },
    amountCents: { type: 'number', example: 15000 },
    type: { type: 'string', enum: ['EXPENSE', 'INCOME'] },
    origin: {
      type: 'string',
      enum: ['ONE_TIME', 'INSTALLMENT', 'RECURRING', 'INCOME'],
    },
    referenceMonth: { type: 'string', example: '2026-03' },
    transactionDate: { type: 'string', format: 'date-time' },
    notes: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true },
    category: categorySchema,
    paymentMethod: paymentMethodSchema,
    installmentPlan: installmentPlanSchema,
  },
};

const transactionEnvelopeSchema = {
  type: 'object',
  properties: {
    data: transactionSchema,
  },
};

const paginatedTransactionsEnvelopeSchema = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      properties: {
        items: { type: 'array', items: transactionSchema },
        total: { type: 'number', example: 42 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  },
};

@ApiTags('Transactions')
@ApiBearerAuth('jwt')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a direct one-time expense (non-credit-card)' })
  @ApiCreatedResponse({
    description: 'One-time transaction created successfully.',
    schema: transactionEnvelopeSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.createDirectExpense(user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List transactions with optional filters and pagination' })
  @ApiOkResponse({
    description: 'Paginated transactions list.',
    schema: paginatedTransactionsEnvelopeSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryTransactionsDto,
  ) {
    const pagination: PaginationDto = { page: query.page, limit: query.limit };
    const filters = {
      type: query.type,
      origin: query.origin,
      referenceMonth: query.reference_month,
      paymentMethodId: query.payment_method_id,
      categoryId: query.category_id,
    };
    return this.transactionsService.findByFilters(user.id, filters, pagination);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single transaction by ID' })
  @ApiOkResponse({
    description: 'Transaction details.',
    schema: transactionEnvelopeSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactionsService.findById(id, user.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a one-time transaction (description, amount, notes, category)' })
  @ApiOkResponse({
    description: 'Updated one-time transaction.',
    schema: transactionEnvelopeSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a one-time transaction' })
  @ApiNoContentResponse({ description: 'Transaction deleted successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.transactionsService.remove(id, user.id);
  }
}
