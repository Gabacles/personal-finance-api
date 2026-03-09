import { Category, TransactionType } from '@prisma/client';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesService {
    private readonly categoriesRepository;
    constructor(categoriesRepository: CategoriesRepository);
    findAll(userId: string, type?: TransactionType): Promise<Category[]>;
    create(userId: string, dto: CreateCategoryDto): Promise<Category>;
    update(id: string, userId: string, dto: UpdateCategoryDto): Promise<Category>;
    remove(id: string, userId: string): Promise<void>;
    validateOwnershipAndType(categoryId: string, userId: string, expectedType: TransactionType): Promise<Category>;
}
