import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@ApiTags('Budgets')
@ApiBearerAuth('jwt')
@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a monthly budget with optional allocations' })
  @ApiCreatedResponse({ description: 'Budget created successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.budgetService.create(user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all monthly budgets' })
  @ApiOkResponse({ description: 'List of user budgets.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.budgetService.findAll(user.id);
  }

  @Get(':month')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the budget for a specific month (YYYY-MM)' })
  @ApiOkResponse({ description: 'Budget for requested month.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('month') month: string,
  ) {
    return this.budgetService.findByMonth(user.id, month);
  }

  @Patch(':month')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update total budget and/or replace allocations for a month' })
  @ApiOkResponse({ description: 'Updated budget for requested month.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('month') month: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetService.update(user.id, month, dto);
  }

  @Delete(':month')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a monthly budget and all its allocations' })
  @ApiNoContentResponse({ description: 'Budget deleted successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('month') month: string,
  ) {
    await this.budgetService.remove(user.id, month);
  }
}
