import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { IncomeService } from './income.service';
import { TaxCalculatorService } from './tax-calculator.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { EstimateTaxDto } from './dto/estimate-tax.dto';
export declare class IncomeController {
    private readonly incomeService;
    private readonly taxCalculatorService;
    constructor(incomeService: IncomeService, taxCalculatorService: TaxCalculatorService);
    estimate(query: EstimateTaxDto): Promise<import("./tax-calculator.service").TaxBreakdown>;
    register(user: AuthenticatedUser, dto: CreateIncomeDto): Promise<{
        deductions: {
            id: string;
            description: string;
            createdAt: Date;
            incomeEntryId: string;
            amountCents: bigint;
            isAutomatic: boolean;
            deductionType: string | null;
        }[];
    } & {
        id: string;
        userId: string;
        referenceMonth: string;
        grossCents: bigint;
        netCents: bigint;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        description: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    findAll(user: AuthenticatedUser): Promise<({
        deductions: {
            id: string;
            description: string;
            createdAt: Date;
            incomeEntryId: string;
            amountCents: bigint;
            isAutomatic: boolean;
            deductionType: string | null;
        }[];
    } & {
        id: string;
        userId: string;
        referenceMonth: string;
        grossCents: bigint;
        netCents: bigint;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        description: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    })[]>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        deductions: {
            id: string;
            description: string;
            createdAt: Date;
            incomeEntryId: string;
            amountCents: bigint;
            isAutomatic: boolean;
            deductionType: string | null;
        }[];
    } & {
        id: string;
        userId: string;
        referenceMonth: string;
        grossCents: bigint;
        netCents: bigint;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        description: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateIncomeDto): Promise<{
        deductions: {
            id: string;
            description: string;
            createdAt: Date;
            incomeEntryId: string;
            amountCents: bigint;
            isAutomatic: boolean;
            deductionType: string | null;
        }[];
    } & {
        id: string;
        userId: string;
        referenceMonth: string;
        grossCents: bigint;
        netCents: bigint;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        description: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<void>;
}
