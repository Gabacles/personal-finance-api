import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Register income for a reference month' })
  register(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIncomeDto,
  ) {
    return this.incomeService.register(user.id, dto);
  }

  @Get()
  @ApiBearerAuth('jwt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all income entries' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.incomeService.findAll(user.id);
  }

  @Get(':id')
  @ApiBearerAuth('jwt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single income entry with deductions' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.incomeService.findById(id, user.id);
  }

  @Patch(':id')
  @ApiBearerAuth('jwt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update income entry gross amount and deductions' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncomeDto,
  ) {
    return this.incomeService.update(id, user.id, dto);
  }
}
