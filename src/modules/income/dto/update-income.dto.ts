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
