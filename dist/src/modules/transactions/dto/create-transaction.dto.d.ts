export declare class CreateTransactionDto {
    categoryId?: string;
    paymentMethodId?: string;
    description: string;
    amountCents: number;
    transactionDate: string;
    notes?: string;
}
