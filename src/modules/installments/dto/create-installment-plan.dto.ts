import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInstallmentPlanDto {
  @ApiProperty({ description: 'Credit card payment method ID (must be CREDIT_CARD)', format: 'uuid' })
  @IsUUID()
  paymentMethodId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'MacBook Pro 16"', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description!: string;

  @ApiProperty({ description: 'Total purchase amount in cents', minimum: 1 })
  @IsInt()
  @IsPositive()
  totalAmountCents!: number;

  @ApiProperty({ description: 'Number of installments (minimum 2)', minimum: 2 })
  @IsInt()
  @Min(2)
  installmentCount!: number;

  @ApiProperty({ example: '2026-03-05', description: 'Purchase date (YYYY-MM-DD), must not be in the future' })
  @IsDateString()
  purchaseDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
