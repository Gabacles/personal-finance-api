import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../shared/decorators/current-user.decorator';
import { CreateInstallmentPlanDto } from './dto/create-installment-plan.dto';
import { InstallmentsService } from './installments.service';

@ApiTags('Installment Plans')
@ApiBearerAuth('jwt')
@Controller('installment-plans')
export class InstallmentsController {
  constructor(private readonly installmentsService: InstallmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an installment plan (generates N transaction rows)' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInstallmentPlanDto,
  ) {
    return this.installmentsService.create(user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all installment plans for the authenticated user' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.installmentsService.findAll(user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single installment plan with its full schedule' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.installmentsService.findById(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an active installment plan (soft-deletes future installments)' })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.installmentsService.cancel(id, user.id);
  }
}
