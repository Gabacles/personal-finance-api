declare class UpdateCreditCardDto {
    closingDay?: number;
    dueDay?: number;
    creditLimitCents?: number;
}
export declare class UpdatePaymentMethodDto {
    name?: string;
    creditCard?: UpdateCreditCardDto;
}
export {};
