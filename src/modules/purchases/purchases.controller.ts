import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../shared/decorators/current-user.decorator';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchasesService } from './purchases.service';

@ApiTags('Purchases')
@ApiBearerAuth('jwt')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a one-time credit card purchase' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.purchasesService.create(user.id, dto);
  }
}
