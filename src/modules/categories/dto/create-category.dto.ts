import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Pets', description: 'Category name (max 100 chars)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string = '';

  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  @IsEnum(TransactionType)
  type: TransactionType = TransactionType.EXPENSE;
}
