import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export class CreateTransactionDto {
  @ApiPropertyOptional({ description: 'Category UUID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Payment method UUID (must not be a credit card)' })
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @ApiProperty({ description: 'Short description of the expense', example: 'Groceries' })
  @IsString()
  description: string = '';

  @ApiProperty({ description: 'Amount in BRL cents (must be ≥ 1)', example: 5000 })
  @IsInt()
  @Min(1)
  amountCents: number = 0;

  @ApiProperty({ description: 'Transaction date in YYYY-MM-DD format', example: '2026-03-07' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'transactionDate must be in YYYY-MM-DD format' })
  transactionDate: string = '';

  @ApiPropertyOptional({ description: 'Optional free-form notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
