import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
export declare class BudgetController {
    private readonly budgetService;
    constructor(budgetService: BudgetService);
    create(user: AuthenticatedUser, dto: CreateBudgetDto): Promise<{
        allocations: {
            id: string;
            categoryId: string | null;
            monthlyBudgetId: string;
            label: string;
            allocatedCents: bigint;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        referenceMonth: string;
        totalBudgetCents: bigint;
    }>;
    findAll(user: AuthenticatedUser): Promise<({
        allocations: {
            id: string;
            categoryId: string | null;
            monthlyBudgetId: string;
            label: string;
            allocatedCents: bigint;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        referenceMonth: string;
        totalBudgetCents: bigint;
    })[]>;
    findOne(user: AuthenticatedUser, month: string): Promise<{
        allocations: {
            id: string;
            categoryId: string | null;
            monthlyBudgetId: string;
            label: string;
            allocatedCents: bigint;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        referenceMonth: string;
        totalBudgetCents: bigint;
    }>;
    update(user: AuthenticatedUser, month: string, dto: UpdateBudgetDto): Promise<{
        allocations: {
            id: string;
            categoryId: string | null;
            monthlyBudgetId: string;
            label: string;
            allocatedCents: bigint;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        referenceMonth: string;
        totalBudgetCents: bigint;
    }>;
    remove(user: AuthenticatedUser, month: string): Promise<void>;
}
