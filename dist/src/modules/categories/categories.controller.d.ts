import { TransactionType } from '@prisma/client';
import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
declare class CategoriesFilterDto {
    type?: TransactionType;
}
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(user: AuthenticatedUser, dto: CreateCategoryDto): Promise<{
        isSystem: boolean;
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        createdAt: Date;
        name: string;
        deletedAt: Date | null;
        userId: string | null;
    }>;
    findAll(user: AuthenticatedUser, query: CategoriesFilterDto): Promise<{
        isSystem: boolean;
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        createdAt: Date;
        name: string;
        deletedAt: Date | null;
        userId: string | null;
    }[]>;
    update(user: AuthenticatedUser, id: string, dto: UpdateCategoryDto): Promise<{
        isSystem: boolean;
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        createdAt: Date;
        name: string;
        deletedAt: Date | null;
        userId: string | null;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<void>;
}
export {};
