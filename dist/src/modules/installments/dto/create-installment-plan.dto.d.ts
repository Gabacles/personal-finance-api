export declare class CreateInstallmentPlanDto {
    paymentMethodId: string;
    categoryId?: string;
    description: string;
    totalAmountCents: number;
    installmentCount: number;
    purchaseDate: string;
    notes?: string;
}
