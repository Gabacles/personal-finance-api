import { Prisma, RecurringTransaction } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
export interface RecurringFilters {
    type?: string;
    isActive?: boolean;
}
export declare class RecurringRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.RecurringTransactionUncheckedCreateInput): Promise<RecurringTransaction>;
    findAllByUser(userId: string, filters?: RecurringFilters): Promise<RecurringTransaction[]>;
    findById(id: string, userId: string): Promise<RecurringTransaction | null>;
    findActiveForMonth(userId: string, month: string): Promise<RecurringTransaction[]>;
    update(id: string, data: Prisma.RecurringTransactionUncheckedUpdateInput): Promise<RecurringTransaction>;
    softDelete(id: string): Promise<void>;
}
