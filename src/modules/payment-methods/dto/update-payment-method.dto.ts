import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

class UpdateCreditCardDto {
  @ApiPropertyOptional({ description: 'Day of month the card closes (1–31)', example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  closingDay?: number;

  @ApiPropertyOptional({ description: 'Day of month the payment is due (1–31)', example: 27 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @ApiPropertyOptional({ description: 'Credit limit in BRL cents', example: 500000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  creditLimitCents?: number;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({ example: 'Nubank Roxinho' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: UpdateCreditCardDto, description: 'Only valid for CREDIT_CARD type' })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCreditCardDto)
  creditCard?: UpdateCreditCardDto;
}
