import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateBudgetAllocationDto {
  @ApiProperty({ description: 'Label for this allocation (e.g. "Food")' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label: string = '';

  @ApiProperty({ description: 'Allocated amount in BRL cents', example: 50000 })
  @IsInt()
  @Min(0)
  allocatedCents: number = 0;

  @ApiPropertyOptional({ description: 'Optional category UUID to link this allocation' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class CreateBudgetDto {
  @ApiProperty({ description: 'Reference month in YYYY-MM format', example: '2026-03' })
  @IsString()
  referenceMonth: string = '';

  @ApiProperty({ description: 'Total monthly budget in BRL cents', example: 500000 })
  @IsInt()
  @Min(1)
  totalBudgetCents: number = 0;

  @ApiPropertyOptional({ type: [CreateBudgetAllocationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetAllocationDto)
  allocations?: CreateBudgetAllocationDto[];
}
