export declare class CreateDeductionDto {
    description: string;
    amountCents: number;
}
export declare class CreateIncomeDto {
    referenceMonth: string;
    grossCents: number;
    description?: string;
    dependents?: number;
    notes?: string;
    customDeductions?: CreateDeductionDto[];
}
