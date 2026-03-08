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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentMethodType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../shared/decorators/current-user.decorator';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodsService } from './payment-methods.service';

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
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaymentMethodsFilterDto,
  ) {
    return this.paymentMethodsService.findAll(user.id, query.type);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single payment method by ID' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentMethodsService.findById(id, user.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update payment method name or credit card details' })
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
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.paymentMethodsService.remove(id, user.id);
  }

  @Get(':id/statement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all transactions for a payment method in a given month' })
  @ApiQuery({ name: 'month', example: '2026-03', description: 'Reference month in YYYY-MM format' })
  getStatement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: StatementQueryDto,
  ) {
    return this.paymentMethodsService.getStatement(id, user.id, query.month);
  }
}
