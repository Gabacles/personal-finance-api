import { PaymentMethodType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { PaymentMethodWithCard, PaymentMethodsRepository } from './payment-methods.repository';
export declare class PaymentMethodsService {
    private readonly paymentMethodsRepository;
    private readonly prisma;
    constructor(paymentMethodsRepository: PaymentMethodsRepository, prisma: PrismaService);
    create(userId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethodWithCard>;
    findAll(userId: string, type?: PaymentMethodType): Promise<PaymentMethodWithCard[]>;
    findById(id: string, userId: string): Promise<PaymentMethodWithCard>;
}
