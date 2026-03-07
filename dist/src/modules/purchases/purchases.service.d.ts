import { PaymentMethodsRepository } from '../payment-methods/payment-methods.repository';
import { CategoriesService } from '../categories/categories.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionWithRelations } from '../transactions/transactions.repository';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
export declare class PurchasesService {
    private readonly paymentMethodsRepository;
    private readonly categoriesService;
    private readonly transactionsService;
    constructor(paymentMethodsRepository: PaymentMethodsRepository, categoriesService: CategoriesService, transactionsService: TransactionsService);
    create(userId: string, dto: CreatePurchaseDto): Promise<TransactionWithRelations>;
}
