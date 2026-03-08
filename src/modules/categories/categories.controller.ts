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
import { IsEnum, IsOptional } from 'class-validator';
import { CurrentUser, AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user-defined category' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all categories (system + user-defined)' })
  @ApiQuery({ name: 'type', enum: TransactionType, required: false })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: CategoriesFilterDto) {
    return this.categoriesService.findAll(user.id, query.type);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rename a user-defined category (type is immutable)' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user-defined category (blocked if in use)' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.categoriesService.remove(id, user.id);
  }
}
