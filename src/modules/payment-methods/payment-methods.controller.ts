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
import { PaymentMethodType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../shared/decorators/current-user.decorator';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodsService } from './payment-methods.service';

const creditCardSchema = {
  type: 'object',
  nullable: true,
  properties: {
    id: { type: 'string', format: 'uuid' },
    paymentMethodId: { type: 'string', format: 'uuid' },
    closingDay: { type: 'number', example: 3 },
    dueDay: { type: 'number', example: 10 },
    creditLimitCents: { type: 'number', nullable: true, example: 1000000 },
  },
};

const paymentMethodSchema = {
  type: 'object',
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

const categorySchema = {
  type: 'object',
  nullable: true,
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid', nullable: true },
    name: { type: 'string', example: 'Assinaturas' },
    type: { type: 'string', enum: ['EXPENSE', 'INCOME'] },
    isSystem: { type: 'boolean', example: false },
    createdAt: { type: 'string', format: 'date-time' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true },
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
    description: { type: 'string', example: 'Notebook' },
    totalAmountCents: { type: 'number', example: 500000 },
    installmentCount: { type: 'number', example: 10 },
    firstReferenceMonth: { type: 'string', example: '2026-03' },
    status: { type: 'string', enum: ['ACTIVE', 'CANCELLED', 'COMPLETED'] },
    purchaseDate: { type: 'string', format: 'date-time' },
    notes: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

const statementTransactionSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    categoryId: { type: 'string', format: 'uuid', nullable: true },
    paymentMethodId: { type: 'string', format: 'uuid', nullable: true },
    installmentPlanId: { type: 'string', format: 'uuid', nullable: true },
    recurringTransactionId: { type: 'string', format: 'uuid', nullable: true },
    incomeEntryId: { type: 'string', format: 'uuid', nullable: true },
    description: { type: 'string', example: 'Notebook (1/10)' },
    amountCents: { type: 'number', example: 50000 },
    type: { type: 'string', enum: ['EXPENSE', 'INCOME'] },
    origin: { type: 'string', enum: ['ONE_TIME', 'INSTALLMENT', 'RECURRING', 'INCOME'] },
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

class PaymentMethodsFilterDto {
  @IsOptional()
  @IsEnum(PaymentMethodType)
  type?: PaymentMethodType;
}

class StatementQueryDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' })
  month!: string;
}

@ApiTags('Payment Methods')
@ApiBearerAuth('jwt')
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new credit card or payment method' })
  @ApiCreatedResponse({ description: 'Payment method created successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.create(user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all payment methods for the authenticated user' })
  @ApiQuery({ name: 'type', enum: PaymentMethodType, required: false })
  @ApiOkResponse({ description: 'List of payment methods.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaymentMethodsFilterDto,
  ) {
    return this.paymentMethodsService.findAll(user.id, query.type);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single payment method by ID' })
  @ApiOkResponse({ description: 'Payment method details.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentMethodsService.findById(id, user.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update payment method name or credit card details' })
  @ApiOkResponse({ description: 'Payment method updated successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a payment method (blocked if it has upcoming installments)' })
  @ApiNoContentResponse({ description: 'Payment method deleted successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.paymentMethodsService.remove(id, user.id);
  }

  @Get(':id/statement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get a credit card statement for a month, including committed and available limit snapshot',
  })
  @ApiQuery({ name: 'month', example: '2026-03', description: 'Reference month in YYYY-MM format' })
  @ApiOkResponse({
    description:
      'Credit card statement for the requested month. totalCents is the billed amount for that statement; committedLimitCents sums the current and future card charges already committed from that month onward.',
    schema: {
      type: 'object',
      properties: {
        paymentMethod: paymentMethodSchema,
        referenceMonth: { type: 'string', example: '2026-03' },
        totalCents: {
          type: 'number',
          example: 50000,
          description: 'Total billed in the requested statement month.',
        },
        committedLimitCents: {
          type: 'number',
          nullable: true,
          example: 500000,
          description:
            'Credit already committed from the requested month onward. For installment plans, this includes every remaining installment amount, not only the current statement charge.',
        },
        availableLimitCents: {
          type: 'number',
          nullable: true,
          example: 500000,
          description:
            'Configured card limit minus committedLimitCents. Null when the card has no configured creditLimitCents.',
        },
        transactions: {
          type: 'array',
          items: statementTransactionSchema,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  getStatement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: StatementQueryDto,
  ) {
    return this.paymentMethodsService.getStatement(id, user.id, query.month);
  }
}
