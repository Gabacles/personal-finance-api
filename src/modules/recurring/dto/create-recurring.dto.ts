import { IsBoolean, IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { TransactionType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRecurringDto {
  @ApiProperty({ example: 'Netflix', description: 'Description of the recurring transaction' })
  @IsString()
  @MaxLength(255)
  description!: string;

  @ApiProperty({ example: 4990, description: 'Amount in cents' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  amountCents!: number;

  @ApiProperty({ enum: TransactionType, description: 'EXPENSE or INCOME' })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty({ example: '2026-03', description: 'Month when recurrence begins (YYYY-MM)' })
  @IsString()
  startMonth!: string;

  @ApiPropertyOptional({ example: '2026-12', description: 'Month when recurrence ends, inclusive (YYYY-MM). Omit for no end.' })
  @IsOptional()
  @IsString()
  endMonth?: string;

  @ApiPropertyOptional({ example: 10, description: 'Day of month used for CREDIT_CARD statement month computation' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  @Type(() => Number)
  dayOfMonth?: number;

  @ApiPropertyOptional({ example: 'uuid', description: 'Category ID (must match transaction type)' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Payment method ID (must be null for INCOME)' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiPropertyOptional({ example: 'Monthly streaming subscription' })
  @IsOptional()
  @IsString()
  notes?: string;
}
