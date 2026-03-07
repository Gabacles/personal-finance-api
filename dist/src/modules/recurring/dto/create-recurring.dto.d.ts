import { TransactionType } from '@prisma/client';
export declare class CreateRecurringDto {
    description: string;
    amountCents: number;
    type: TransactionType;
    startMonth: string;
    endMonth?: string;
    dayOfMonth?: number;
    categoryId?: string;
    paymentMethodId?: string;
    notes?: string;
}
