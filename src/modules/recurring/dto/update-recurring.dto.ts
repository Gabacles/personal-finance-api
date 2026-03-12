import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateRecurringDto {
  @ApiPropertyOptional({ example: 'Netflix HD' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: 5990, description: 'New amount in cents' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  amountCents?: number;

  @ApiPropertyOptional({ example: '2026-12', description: 'End month (YYYY-MM), set to null to remove.' })
  @IsOptional()
  @IsString()
  endMonth?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  @Type(() => Number)
  dayOfMonth?: number;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Override whether INSS/IRRF deductions are applied during generation. Only valid when type=INCOME.',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  applyTaxDeductions?: boolean;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of tax dependents for IRRF calculation.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  dependents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
