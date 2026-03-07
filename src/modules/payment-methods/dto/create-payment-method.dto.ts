import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethodType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateCreditCardDto {
  @ApiProperty({ description: 'Day of month the card closes (1–31)', example: 20 })
  @IsInt()
  @Min(1)
  @Max(31)
  closingDay: number = 0;

  @ApiProperty({ description: 'Day of month the payment is due (1–31)', example: 27 })
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay: number = 0;

  @ApiPropertyOptional({ description: 'Credit limit in BRL cents', example: 500000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  creditLimitCents?: number;
}

export class CreatePaymentMethodDto {
  @ApiProperty({ example: 'Nubank Roxinho' })
  @IsString()
  name: string = '';

  @ApiProperty({ enum: PaymentMethodType, example: PaymentMethodType.CREDIT_CARD })
  @IsEnum(PaymentMethodType)
  type: PaymentMethodType = PaymentMethodType.CREDIT_CARD;

  @ApiPropertyOptional({ type: CreateCreditCardDto })
  @ValidateIf((o: CreatePaymentMethodDto) => o.type === PaymentMethodType.CREDIT_CARD)
  @ValidateNested()
  @Type(() => CreateCreditCardDto)
  creditCard?: CreateCreditCardDto;
}
