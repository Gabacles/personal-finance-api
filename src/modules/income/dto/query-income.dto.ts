import { PaginationDto } from '../../../shared/pagination/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class QueryIncomeDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by reference month (YYYY-MM).',
    example: '2026-03',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'referenceMonth must be in YYYY-MM format',
  })
  referenceMonth?: string;
}
