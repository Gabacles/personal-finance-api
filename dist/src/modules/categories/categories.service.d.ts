import { Category, TransactionType } from '@prisma/client';
import { CategoriesRepository } from './categories.repository';
export declare class CategoriesService {
    private readonly categoriesRepository;
    constructor(categoriesRepository: CategoriesRepository);
    seedSystemCategories(userId: string): Promise<void>;
    findAll(userId: string, type?: TransactionType): Promise<Category[]>;
    validateOwnershipAndType(categoryId: string, userId: string, expectedType: TransactionType): Promise<Category>;
}
