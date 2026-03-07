import { TransactionType } from '@prisma/client';
import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { CategoriesService } from './categories.service';
declare class CategoriesFilterDto {
    type?: TransactionType;
}
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(user: AuthenticatedUser, query: CategoriesFilterDto): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        createdAt: Date;
        name: string;
        userId: string | null;
        isSystem: boolean;
        deletedAt: Date | null;
    }[]>;
}
export {};
