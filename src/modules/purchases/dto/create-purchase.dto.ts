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
} from 'class-validator';

export class CreatePurchaseDto {
  @ApiProperty({ description: 'Credit card payment method ID (must be CREDIT_CARD type)', format: 'uuid' })
  @IsUUID()
  paymentMethodId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'Supermercado Extra', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description!: string;

  @ApiProperty({ description: 'Amount in cents (e.g. 4990 = R$49,90)', minimum: 1 })
  @IsInt()
  @IsPositive()
  amountCents!: number;

  @ApiProperty({ example: '2026-03-15', description: 'ISO date string (YYYY-MM-DD), must not be in the future' })
  @IsDateString()
  purchaseDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
