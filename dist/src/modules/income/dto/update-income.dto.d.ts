import { CreateDeductionDto } from './create-income.dto';
export declare class UpdateIncomeDto {
    grossCents?: number;
    description?: string;
    dependents?: number;
    notes?: string;
    customDeductions?: CreateDeductionDto[];
}
