import { Category, TransactionType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
export declare class CategoriesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createUserCategory(data: {
        userId: string;
        name: string;
        type: TransactionType;
    }): Promise<Category>;
    findAllForUser(userId: string, type?: TransactionType): Promise<Category[]>;
    findById(id: string): Promise<Category | null>;
    updateName(id: string, name: string): Promise<Category>;
    softDelete(id: string): Promise<void>;
    countUsage(id: string): Promise<number>;
}
