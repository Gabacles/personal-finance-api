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
            createdAt: Date;
            description: string;
            amountCents: bigint;
            incomeEntryId: string;
            isAutomatic: boolean;
            deductionType: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        description: string;
        userId: string;
        deletedAt: Date | null;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        updatedAt: Date;
        referenceMonth: string;
        notes: string | null;
        grossCents: bigint;
        netCents: bigint;
    }>;
    findAll(user: AuthenticatedUser): Promise<({
        deductions: {
            id: string;
            createdAt: Date;
            description: string;
            amountCents: bigint;
            incomeEntryId: string;
            isAutomatic: boolean;
            deductionType: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        description: string;
        userId: string;
        deletedAt: Date | null;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        updatedAt: Date;
        referenceMonth: string;
        notes: string | null;
        grossCents: bigint;
        netCents: bigint;
    })[]>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        deductions: {
            id: string;
            createdAt: Date;
            description: string;
            amountCents: bigint;
            incomeEntryId: string;
            isAutomatic: boolean;
            deductionType: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        description: string;
        userId: string;
        deletedAt: Date | null;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        updatedAt: Date;
        referenceMonth: string;
        notes: string | null;
        grossCents: bigint;
        netCents: bigint;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateIncomeDto): Promise<{
        deductions: {
            id: string;
            createdAt: Date;
            description: string;
            amountCents: bigint;
            incomeEntryId: string;
            isAutomatic: boolean;
            deductionType: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        description: string;
        userId: string;
        deletedAt: Date | null;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        updatedAt: Date;
        referenceMonth: string;
        notes: string | null;
        grossCents: bigint;
        netCents: bigint;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<void>;
}
