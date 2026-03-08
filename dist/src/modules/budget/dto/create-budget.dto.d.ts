export declare class CreateBudgetAllocationDto {
    label: string;
    allocatedCents: number;
    categoryId?: string;
}
export declare class CreateBudgetDto {
    referenceMonth: string;
    totalBudgetCents: number;
    allocations?: CreateBudgetAllocationDto[];
}
