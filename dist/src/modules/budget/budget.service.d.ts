import { PrismaService } from '../../shared/database/prisma.service';
import { BudgetRepository, BudgetWithAllocations } from './budget.repository';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
export declare class BudgetService {
    private readonly budgetRepository;
    private readonly prisma;
    constructor(budgetRepository: BudgetRepository, prisma: PrismaService);
    create(userId: string, dto: CreateBudgetDto): Promise<BudgetWithAllocations>;
    findAll(userId: string): Promise<BudgetWithAllocations[]>;
    findByMonth(userId: string, month: string): Promise<BudgetWithAllocations>;
    update(userId: string, month: string, dto: UpdateBudgetDto): Promise<BudgetWithAllocations>;
    remove(userId: string, month: string): Promise<void>;
}
