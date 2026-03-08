import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeductionDto {
  @ApiProperty({ example: 'Plano de saúde', description: 'Deduction description' })
  @IsString()
  @MaxLength(100)
  description!: string;

  @ApiProperty({ example: 50000, description: 'Deduction amount in cents' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  amountCents!: number;
}

export class CreateIncomeDto {
  @ApiProperty({ example: '2026-03', description: 'Reference month (YYYY-MM)' })
  @IsString()
  referenceMonth!: string;

  @ApiProperty({ example: 700000, description: 'Gross salary in cents (R$7,000 = 700000)' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  grossCents!: number;

  @ApiPropertyOptional({ example: 'Salário', description: 'Description (default: Salário)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: 0, description: 'Number of dependents for IRRF deduction (CLT only)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  dependents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    type: [CreateDeductionDto],
    description: 'Additional custom deductions (e.g., health plan, pension)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeductionDto)
  customDeductions?: CreateDeductionDto[];
}
