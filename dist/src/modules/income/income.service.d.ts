import { PrismaService } from '../../shared/database/prisma.service';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TaxCalculatorService } from './tax-calculator.service';
import { IncomeDeductionRepository } from './income-deduction.repository';
import { IncomeEntryWithDeductions, IncomeRepository } from './income.repository';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
export declare class IncomeService {
    private readonly incomeRepository;
    private readonly incomeDeductionRepository;
    private readonly taxCalculatorService;
    private readonly usersService;
    private readonly transactionsService;
    private readonly prisma;
    constructor(incomeRepository: IncomeRepository, incomeDeductionRepository: IncomeDeductionRepository, taxCalculatorService: TaxCalculatorService, usersService: UsersService, transactionsService: TransactionsService, prisma: PrismaService);
    register(userId: string, dto: CreateIncomeDto): Promise<IncomeEntryWithDeductions>;
    update(id: string, userId: string, dto: UpdateIncomeDto): Promise<IncomeEntryWithDeductions>;
    findAll(userId: string): Promise<IncomeEntryWithDeductions[]>;
    findById(id: string, userId: string): Promise<IncomeEntryWithDeductions>;
    remove(id: string, userId: string): Promise<void>;
}
