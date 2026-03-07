import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentMethodType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../shared/decorators/current-user.decorator';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { PaymentMethodsService } from './payment-methods.service';

class PaymentMethodsFilterDto {
  @IsOptional()
  @IsEnum(PaymentMethodType)
  type?: PaymentMethodType;
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
}
