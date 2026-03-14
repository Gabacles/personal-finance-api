import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
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

  @ApiPropertyOptional({
    example: true,
    description:
      'When true (default), CLT users have automatic INSS/IRRF deductions. When false, no automatic tax deductions are applied.',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  applyTaxDeductions?: boolean;

  @ApiPropertyOptional({
    example: '2e24553b-5f99-4f1f-a8c0-35b5b26f90d8',
    description:
      'Optional INCOME category ID for the linked ledger transaction. Category must belong to the user (or be a system category) and be of type INCOME.',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

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
