import { Category, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
export declare class CategoriesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createMany(data: Prisma.CategoryCreateManyInput[]): Promise<void>;
    findAllForUser(userId: string, type?: TransactionType): Promise<Category[]>;
    findById(id: string): Promise<Category | null>;
}
