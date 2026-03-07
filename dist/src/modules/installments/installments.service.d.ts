import { PrismaService } from '../../shared/database/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import { PaymentMethodsRepository } from '../payment-methods/payment-methods.repository';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionsRepository } from '../transactions/transactions.repository';
import { InstallmentPlanWithTransactions, InstallmentsRepository } from './installments.repository';
import { CreateInstallmentPlanDto } from './dto/create-installment-plan.dto';
export interface CancelResult {
    cancelledCount: number;
    preservedCount: number;
}
export declare class InstallmentsService {
    private readonly installmentsRepository;
    private readonly transactionsRepository;
    private readonly paymentMethodsRepository;
    private readonly categoriesService;
    private readonly transactionsService;
    private readonly prisma;
    constructor(installmentsRepository: InstallmentsRepository, transactionsRepository: TransactionsRepository, paymentMethodsRepository: PaymentMethodsRepository, categoriesService: CategoriesService, transactionsService: TransactionsService, prisma: PrismaService);
    create(userId: string, dto: CreateInstallmentPlanDto): Promise<InstallmentPlanWithTransactions>;
    cancel(id: string, userId: string): Promise<CancelResult>;
    findAll(userId: string): Promise<InstallmentPlanWithTransactions[]>;
    findById(id: string, userId: string): Promise<InstallmentPlanWithTransactions>;
}
