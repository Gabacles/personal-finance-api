import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EstimateTaxDto {
  @ApiProperty({ example: 700000, description: 'Gross salary in cents' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  grossCents!: number;

  @ApiPropertyOptional({ example: 2026, description: 'Tax year (defaults to current year)' })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({ example: 0, description: 'Number of dependents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  dependents?: number;
}
