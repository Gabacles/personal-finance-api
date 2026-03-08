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
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        createdAt: Date;
        name: string;
        userId: string | null;
        isSystem: boolean;
        deletedAt: Date | null;
    }>;
    findAll(user: AuthenticatedUser, query: CategoriesFilterDto): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        createdAt: Date;
        name: string;
        userId: string | null;
        isSystem: boolean;
        deletedAt: Date | null;
    }[]>;
    update(user: AuthenticatedUser, id: string, dto: UpdateCategoryDto): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        createdAt: Date;
        name: string;
        userId: string | null;
        isSystem: boolean;
        deletedAt: Date | null;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<void>;
}
export {};
