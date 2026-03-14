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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateDeductionDto } from './create-income.dto';

export class UpdateIncomeDto {
  @ApiPropertyOptional({ example: 750000, description: 'New gross amount in cents' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  grossCents?: number;

  @ApiPropertyOptional({ example: 'Salário Janeiro' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: 1, description: 'Number of dependents for IRRF (repass if changed)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  dependents?: number;

  @ApiPropertyOptional({
    example: true,
    description:
      'When true, CLT users have automatic INSS/IRRF deductions. When false, automatic tax deductions are removed from this entry.',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  applyTaxDeductions?: boolean;

  @ApiPropertyOptional({
    example: '2e24553b-5f99-4f1f-a8c0-35b5b26f90d8',
    description:
      'Optional INCOME category ID for the linked ledger transaction. Category must be type INCOME.',
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
    description: 'Replaces all existing custom deductions when provided',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeductionDto)
  customDeductions?: CreateDeductionDto[];
}
