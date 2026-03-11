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

@ApiTags('Recurring Transactions')
@ApiBearerAuth('jwt')
@Controller('recurring-transactions')
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a recurring transaction template' })
  @ApiCreatedResponse({ description: 'Recurring transaction created successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
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
  @ApiOkResponse({ description: 'List of recurring transaction templates.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
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
  @ApiOkResponse({ description: 'Recurring transaction template details.' })
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
  @ApiOkResponse({ description: 'Updated recurring transaction template.' })
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
  @ApiOkResponse({ description: 'Recurring transaction template activated.' })
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
  @ApiOkResponse({ description: 'Recurring transaction template deactivated.' })
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
