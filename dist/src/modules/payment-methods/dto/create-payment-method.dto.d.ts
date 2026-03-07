import { PaymentMethodType } from '@prisma/client';
export declare class CreateCreditCardDto {
    closingDay: number;
    dueDay: number;
    creditLimitCents?: number;
}
export declare class CreatePaymentMethodDto {
    name: string;
    type: PaymentMethodType;
    creditCard?: CreateCreditCardDto;
}
