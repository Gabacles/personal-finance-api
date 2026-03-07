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
import { TransactionType } from '@prisma/client';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../shared/decorators/current-user.decorator';
import { RecurringService } from './recurring.service';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';

@ApiTags('Recurring Transactions')
@ApiBearerAuth('jwt')
@Controller('recurring-transactions')
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a recurring transaction template' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRecurringDto,
  ) {
    return this.recurringService.create(user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List recurring transaction templates' })
  @ApiQuery({ name: 'type', enum: TransactionType, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('type') type?: TransactionType,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveParsed =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.recurringService.findAll(user.id, { type, isActive: isActiveParsed });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single recurring transaction template' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recurringService.findById(id, user.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a recurring transaction template' })
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
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recurringService.activate(id, user.id);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a recurring transaction template' })
  deactivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recurringService.deactivate(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a recurring transaction template' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recurringService.remove(id, user.id);
  }
}
