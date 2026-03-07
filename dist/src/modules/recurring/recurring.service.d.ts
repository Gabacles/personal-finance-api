import { RecurringTransaction } from '@prisma/client';
import { CategoriesService } from '../categories/categories.service';
import { PaymentMethodsRepository } from '../payment-methods/payment-methods.repository';
import { TransactionsService } from '../transactions/transactions.service';
import { RecurringFilters, RecurringRepository } from './recurring.repository';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
export interface GenerateResult {
    generated: number;
    skipped: number;
}
export declare class RecurringService {
    private readonly recurringRepository;
    private readonly paymentMethodsRepository;
    private readonly categoriesService;
    private readonly transactionsService;
    constructor(recurringRepository: RecurringRepository, paymentMethodsRepository: PaymentMethodsRepository, categoriesService: CategoriesService, transactionsService: TransactionsService);
    create(userId: string, dto: CreateRecurringDto): Promise<RecurringTransaction>;
    generateForMonth(userId: string, month: string): Promise<GenerateResult>;
    findAll(userId: string, filters?: RecurringFilters): Promise<RecurringTransaction[]>;
    findById(id: string, userId: string): Promise<RecurringTransaction>;
    update(id: string, userId: string, dto: UpdateRecurringDto): Promise<RecurringTransaction>;
    activate(id: string, userId: string): Promise<RecurringTransaction>;
    deactivate(id: string, userId: string): Promise<RecurringTransaction>;
    remove(id: string, userId: string): Promise<void>;
    private computeReferenceMonth;
    private dayOfMonthToDateInMonth;
}
