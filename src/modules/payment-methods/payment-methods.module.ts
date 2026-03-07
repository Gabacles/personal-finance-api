import { Module } from '@nestjs/common';
import { CreditCardRepository } from './credit-card.repository';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsRepository } from './payment-methods.repository';
import { PaymentMethodsService } from './payment-methods.service';

@Module({
  controllers: [PaymentMethodsController],
  providers: [
    PaymentMethodsService,
    PaymentMethodsRepository,
    CreditCardRepository,
  ],
  exports: [PaymentMethodsService, PaymentMethodsRepository, CreditCardRepository],
})
export class PaymentMethodsModule {}
