import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CurrentUser, AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { CategoriesService } from './categories.service';

class CategoriesFilterDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}

@ApiTags('Categories')
@ApiBearerAuth('jwt')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all categories (system + user-defined)' })
  @ApiQuery({ name: 'type', enum: TransactionType, required: false })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: CategoriesFilterDto) {
    return this.categoriesService.findAll(user.id, query.type);
  }
}
