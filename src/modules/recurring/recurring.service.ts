import { Injectable } from '@nestjs/common';
import { EmploymentType, PaymentMethodType, RecurringTransaction, TransactionType } from '@prisma/client';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import { CategoriesService } from '../categories/categories.service';
import { PaymentMethodsRepository } from '../payment-methods/payment-methods.repository';
import { computeStatementMonth } from '../payment-methods/credit-card-statement.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TaxCalculatorService } from '../income/tax-calculator.service';
import { UsersService } from '../users/users.service';
import { RecurringFilters, RecurringRepository } from './recurring.repository';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';

export interface GenerateResult {
  generated: number;
  skipped: number;
}

function currentReferenceMonth(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

@Injectable()
export class RecurringService {
  constructor(
    private readonly recurringRepository: RecurringRepository,
    private readonly paymentMethodsRepository: PaymentMethodsRepository,
    private readonly categoriesService: CategoriesService,
    private readonly transactionsService: TransactionsService,
    private readonly taxCalculatorService: TaxCalculatorService,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateRecurringDto): Promise<RecurringTransaction> {
    // INCOME must not have a payment method
    if (dto.type === TransactionType.INCOME && dto.paymentMethodId) {
      throw new BusinessRuleException(
        'INCOME_WITH_PAYMENT_METHOD',
        'Income recurring transactions cannot have a payment method',
      );
    }

    // applyTaxDeductions is only valid for INCOME
    if (dto.applyTaxDeductions && dto.type !== TransactionType.INCOME) {
      throw new BusinessRuleException(
        'TAX_DEDUCTIONS_ONLY_FOR_INCOME',
        'applyTaxDeductions can only be set for INCOME recurring transactions',
      );
    }

    // Validate payment method if provided
    if (dto.paymentMethodId) {
      const pm = await this.paymentMethodsRepository.findById(dto.paymentMethodId, userId);
      if (!pm) throw new EntityNotFoundException('PaymentMethod', dto.paymentMethodId);

      // EXPENSE + CREDIT_CARD requires dayOfMonth for statement computation
      if (pm.type === PaymentMethodType.CREDIT_CARD && !dto.dayOfMonth) {
        throw new BusinessRuleException(
          'CREDIT_CARD_DAY_OF_MONTH_REQUIRED',
          'dayOfMonth is required for CREDIT_CARD recurring transactions',
        );
      }
    }

    // Validate category type matches transaction type
    if (dto.categoryId) {
      await this.categoriesService.validateOwnershipAndType(
        dto.categoryId,
        userId,
        dto.type,
      );
    }

    // Validate endMonth >= startMonth if provided
    if (dto.endMonth && dto.endMonth < dto.startMonth) {
      throw new BusinessRuleException(
        'END_MONTH_BEFORE_START_MONTH',
        'endMonth must be equal to or after startMonth',
      );
    }

    return this.recurringRepository.create({
      userId,
      description: dto.description,
      amountCents: BigInt(dto.amountCents),
      type: dto.type,
      startMonth: dto.startMonth,
      endMonth: dto.endMonth,
      dayOfMonth: dto.dayOfMonth,
      categoryId: dto.categoryId,
      paymentMethodId: dto.paymentMethodId,
      notes: dto.notes,
      applyTaxDeductions: dto.applyTaxDeductions ?? false,
      dependents: dto.dependents ?? 0,
    });
  }

  /**
   * For each active template valid in `month`, attempt to generate a transaction.
   * Idempotent: the unique constraint on (recurringTransactionId, referenceMonth)
   * causes P2002 for already-generated entries — those are silently skipped.
   */
  async generateForMonth(userId: string, month: string): Promise<GenerateResult> {
    const templates = await this.recurringRepository.findActiveForMonth(userId, month);
    let generated = 0;
    let skipped = 0;

    // Lazily fetch the user only if at least one template requests tax deductions
    let userEmploymentType: EmploymentType | null = null;

    for (const template of templates) {
      const referenceMonth = await this.computeReferenceMonth(template, month);

      // Compute net amount when the template requests automatic tax deductions
      let amountCents = template.amountCents;
      if (template.applyTaxDeductions && template.type === TransactionType.INCOME) {
        if (userEmploymentType === null) {
          const user = await this.usersService.findById(userId);
          userEmploymentType = user.employmentType;
        }
        if (userEmploymentType === EmploymentType.CLT) {
          const year = parseInt(month.slice(0, 4), 10);
          const breakdown = await this.taxCalculatorService.computeCLT(
            template.amountCents,
            year,
            template.dependents,
          );
          amountCents = breakdown.netCents;
        }
        // For PJ/OTHER: no automatic deductions — use the stored amount as-is
      }

      const result = await this.transactionsService.createFromRecurring({
        userId,
        recurringTransactionId: template.id,
        categoryId: template.categoryId ?? undefined,
        paymentMethodId: template.paymentMethodId ?? undefined,
        description: template.description,
        amountCents,
        type: template.type,
        referenceMonth,
        transactionDate: new Date(),
        notes: template.notes ?? undefined,
      });

      if (result === null) {
        skipped++;
      } else {
        generated++;
      }
    }

    return { generated, skipped };
  }

  async findAll(userId: string, filters: RecurringFilters = {}): Promise<RecurringTransaction[]> {
    return this.recurringRepository.findAllByUser(userId, filters);
  }

  async findActiveForMonth(
    userId: string,
    month: string,
  ): Promise<RecurringTransaction[]> {
    return this.recurringRepository.findActiveForMonth(userId, month);
  }

  async findById(id: string, userId: string): Promise<RecurringTransaction> {
    const template = await this.recurringRepository.findById(id, userId);
    if (!template) throw new EntityNotFoundException('RecurringTransaction', id);
    return template;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateRecurringDto,
  ): Promise<RecurringTransaction> {
    const template = await this.recurringRepository.findById(id, userId);
    if (!template) throw new EntityNotFoundException('RecurringTransaction', id);

    // Re-validate category if changing
    if (dto.categoryId) {
      await this.categoriesService.validateOwnershipAndType(
        dto.categoryId,
        userId,
        template.type,
      );
    }

    // Re-validate payment method if changing (INCOME cannot have PM)
    if (dto.paymentMethodId) {
      if (template.type === TransactionType.INCOME) {
        throw new BusinessRuleException(
          'INCOME_WITH_PAYMENT_METHOD',
          'Income recurring transactions cannot have a payment method',
        );
      }
      const pm = await this.paymentMethodsRepository.findById(dto.paymentMethodId, userId);
      if (!pm) throw new EntityNotFoundException('PaymentMethod', dto.paymentMethodId);
    }

    if (dto.endMonth && dto.endMonth < template.startMonth) {
      throw new BusinessRuleException(
        'END_MONTH_BEFORE_START_MONTH',
        'endMonth must be equal to or after startMonth',
      );
    }

    // applyTaxDeductions can only be set on INCOME templates
    if (dto.applyTaxDeductions && template.type !== TransactionType.INCOME) {
      throw new BusinessRuleException(
        'TAX_DEDUCTIONS_ONLY_FOR_INCOME',
        'applyTaxDeductions can only be set for INCOME recurring transactions',
      );
    }

    const updated = await this.recurringRepository.update(id, {
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.amountCents !== undefined ? { amountCents: BigInt(dto.amountCents) } : {}),
      ...(dto.endMonth !== undefined ? { endMonth: dto.endMonth } : {}),
      ...(dto.dayOfMonth !== undefined ? { dayOfMonth: dto.dayOfMonth } : {}),
      ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
      ...(dto.paymentMethodId !== undefined ? { paymentMethodId: dto.paymentMethodId } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...(dto.applyTaxDeductions !== undefined ? { applyTaxDeductions: dto.applyTaxDeductions } : {}),
      ...(dto.dependents !== undefined ? { dependents: dto.dependents } : {}),
    });

    // Propagate field changes to already-materialized transactions for the current month onwards.
    // Past months are intentionally left untouched to preserve financial history.
    const propagation: Record<string, unknown> = {};
    if (dto.description !== undefined) propagation.description = dto.description;
    if (dto.categoryId !== undefined) propagation.categoryId = dto.categoryId;
    if (dto.paymentMethodId !== undefined) propagation.paymentMethodId = dto.paymentMethodId;
    if (dto.notes !== undefined) propagation.notes = dto.notes;

    // Recompute the effective (net) amount whenever any amount-affecting field changed
    const amountAffected =
      dto.amountCents !== undefined ||
      dto.applyTaxDeductions !== undefined ||
      dto.dependents !== undefined;

    if (amountAffected) {
      let effectiveAmount = updated.amountCents;
      if (updated.applyTaxDeductions && updated.type === TransactionType.INCOME) {
        const user = await this.usersService.findById(userId);
        if (user.employmentType === EmploymentType.CLT) {
          const year = parseInt(currentReferenceMonth().slice(0, 4), 10);
          const breakdown = await this.taxCalculatorService.computeCLT(
            updated.amountCents,
            year,
            updated.dependents,
          );
          effectiveAmount = breakdown.netCents;
        }
      }
      propagation.amountCents = effectiveAmount;
    }

    if (Object.keys(propagation).length > 0) {
      await this.transactionsService.updateMaterializedByRecurringId(
        id,
        currentReferenceMonth(),
        propagation as any,
      );
    }

    return updated;
  }

  async activate(id: string, userId: string): Promise<RecurringTransaction> {
    const template = await this.recurringRepository.findById(id, userId);
    if (!template) throw new EntityNotFoundException('RecurringTransaction', id);
    return this.recurringRepository.update(id, { isActive: true });
  }

  async deactivate(id: string, userId: string): Promise<RecurringTransaction> {
    const template = await this.recurringRepository.findById(id, userId);
    if (!template) throw new EntityNotFoundException('RecurringTransaction', id);
    return this.recurringRepository.update(id, { isActive: false });
  }

  async remove(id: string, userId: string): Promise<void> {
    const template = await this.recurringRepository.findById(id, userId);
    if (!template) throw new EntityNotFoundException('RecurringTransaction', id);
    await this.recurringRepository.softDelete(id);
    // Cascade: soft-delete all transactions that were generated from this template
    await this.transactionsService.softDeleteByRecurringTransactionId(id);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async computeReferenceMonth(
    template: RecurringTransaction,
    month: string,
  ): Promise<string> {
    // For CREDIT_CARD expenses, the statement month may differ from the template month
    if (
      template.paymentMethodId &&
      template.dayOfMonth &&
      template.type === TransactionType.EXPENSE
    ) {
      const pm = await this.paymentMethodsRepository.findById(
        template.paymentMethodId,
        template.userId,
      );
      if (pm?.creditCard) {
        const date = this.dayOfMonthToDateInMonth(template.dayOfMonth, month);
        const { referenceMonth } = computeStatementMonth(pm.creditCard.closingDay, date);
        return referenceMonth;
      }
    }
    return month;
  }

  /**
   * Builds a Date representing `dayOfMonth` within `month` (YYYY-MM), UTC noon.
   * Clamps to the last day of the month if dayOfMonth > actual days.
   */
  private dayOfMonthToDateInMonth(dayOfMonth: number, month: string): Date {
    const [year, m] = month.split('-').map(Number);
    const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
    const day = Math.min(dayOfMonth, lastDay);
    return new Date(Date.UTC(year, m - 1, day, 12, 0, 0));
  }
}
