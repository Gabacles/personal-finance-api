import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionOrigin, TransactionType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID, Matches } from 'class-validator';
import { PaginationDto } from '../../../shared/pagination/pagination.dto';

export class QueryTransactionsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ enum: TransactionOrigin })
  @IsOptional()
  @IsEnum(TransactionOrigin)
  origin?: TransactionOrigin;

  @ApiPropertyOptional({ example: '2026-03', description: 'YYYY-MM' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'reference_month must be in YYYY-MM format' })
  reference_month?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  payment_method_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  category_id?: string;
}
