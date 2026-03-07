import { TransactionOrigin, TransactionType } from '@prisma/client';
import { PaginationDto } from '../../../shared/pagination/pagination.dto';
export declare class QueryTransactionsDto extends PaginationDto {
    type?: TransactionType;
    origin?: TransactionOrigin;
    reference_month?: string;
    payment_method_id?: string;
    category_id?: string;
}
