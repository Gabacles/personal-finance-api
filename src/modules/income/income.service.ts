import { Injectable } from '@nestjs/common';
import { EmploymentType, Prisma } from '@prisma/client';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import { PrismaService } from '../../shared/database/prisma.service';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TaxBreakdown, TaxCalculatorService } from './tax-calculator.service';
import { IncomeDeductionRepository } from './income-deduction.repository';
import { IncomeEntryWithDeductions, IncomeRepository } from './income.repository';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';

@Injectable()
export class IncomeService {
  constructor(
    private readonly incomeRepository: IncomeRepository,
    private readonly incomeDeductionRepository: IncomeDeductionRepository,
    private readonly taxCalculatorService: TaxCalculatorService,
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
    private readonly prisma: PrismaService,
  ) {}

  async register(
    userId: string,
    dto: CreateIncomeDto,
  ): Promise<IncomeEntryWithDeductions> {
    const user = await this.usersService.findById(userId);
    const year = parseInt(dto.referenceMonth.slice(0, 4), 10);
    const grossCents = BigInt(dto.grossCents);
    const dependents = dto.dependents ?? 0;

    // Check for duplicate
    const existing = await this.incomeRepository.findByMonth(
      userId,
      dto.referenceMonth,
    );
    if (existing) {
      throw new BusinessRuleException(
        'INCOME_ALREADY_REGISTERED',
        `An income entry already exists for month ${dto.referenceMonth}`,
      );
    }

    // Compute auto deductions for CLT employees
    let taxBreakdown: TaxBreakdown | null = null;
    if (user.employmentType === EmploymentType.CLT) {
      taxBreakdown = await this.taxCalculatorService.computeCLT(
        grossCents,
        year,
        dependents,
      );
    }

    // Build deduction list
    const autoDeductions = buildAutoDeductions(taxBreakdown);
    const customDeductions = (dto.customDeductions ?? []).map((d) => ({
      description: d.description,
      amountCents: BigInt(d.amountCents),
      isAutomatic: false as const,
    }));

    const totalDeductionCents =
      autoDeductions.reduce((s, d) => s + d.amountCents, 0n) +
      customDeductions.reduce((s, d) => s + d.amountCents, 0n);

    const netCents = grossCents - totalDeductionCents;
    if (netCents <= 0n) {
      throw new BusinessRuleException(
        'NET_INCOME_NOT_POSITIVE',
        'Net income after deductions must be greater than zero',
      );
    }

    // Atomic: create entry + deductions + transaction
    const entry = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const created = await this.incomeRepository.create(
          {
            userId,
            referenceMonth: dto.referenceMonth,
            grossCents,
            netCents,
            employmentType: user.employmentType,
            description: dto.description ?? 'Salário',
            notes: dto.notes,
          },
          tx,
        );

        const allDeductions = [
          ...autoDeductions.map((d) => ({
            incomeEntryId: created.id,
            description: d.description,
            amountCents: d.amountCents,
            isAutomatic: true,
            deductionType: d.deductionType,
          })),
          ...customDeductions.map((d) => ({
            incomeEntryId: created.id,
            description: d.description,
            amountCents: d.amountCents,
            isAutomatic: false,
            deductionType: null as null,
          })),
        ];

        if (allDeductions.length > 0) {
          await this.incomeDeductionRepository.createMany(allDeductions, tx);
        }

        await this.transactionsService.createIncomeTransaction(
          {
            userId,
            incomeEntryId: created.id,
            description: dto.description ?? 'Salário',
            amountCents: netCents,
            referenceMonth: dto.referenceMonth,
            transactionDate: new Date(),
            notes: dto.notes,
          },
          tx,
        );

        return created;
      },
    );

    const full = await this.incomeRepository.findById(entry.id, userId);
    if (!full) throw new EntityNotFoundException('IncomeEntry', entry.id);
    return full;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateIncomeDto,
  ): Promise<IncomeEntryWithDeductions> {
    const entry = await this.incomeRepository.findById(id, userId);
    if (!entry) throw new EntityNotFoundException('IncomeEntry', id);

    const newGrossCents =
      dto.grossCents !== undefined ? BigInt(dto.grossCents) : entry.grossCents;
    const dependents = dto.dependents ?? 0;
    const year = parseInt(entry.referenceMonth.slice(0, 4), 10);

    // Recompute auto deductions when CLT
    let taxBreakdown: TaxBreakdown | null = null;
    if (entry.employmentType === EmploymentType.CLT) {
      taxBreakdown = await this.taxCalculatorService.computeCLT(
        newGrossCents,
        year,
        dependents,
      );
    }

    const autoDeductions = buildAutoDeductions(taxBreakdown);

    // Custom deductions: replace if provided, otherwise keep existing custom ones
    const existingCustom = entry.deductions
      .filter((d) => !d.isAutomatic)
      .map((d) => ({ description: d.description, amountCents: d.amountCents }));

    const newCustomDeductions = (
      dto.customDeductions !== undefined ? dto.customDeductions : existingCustom
    ).map((d) => ({
      description: d.description,
      amountCents: BigInt(d.amountCents),
      isAutomatic: false as const,
    }));

    const totalDeductionCents =
      autoDeductions.reduce((s, d) => s + d.amountCents, 0n) +
      newCustomDeductions.reduce((s, d) => s + d.amountCents, 0n);

    const newNetCents = newGrossCents - totalDeductionCents;
    if (newNetCents <= 0n) {
      throw new BusinessRuleException(
        'NET_INCOME_NOT_POSITIVE',
        'Net income after deductions must be greater than zero',
      );
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (dto.customDeductions !== undefined) {
        // Replace all deductions (auto + custom) from scratch
        await this.incomeDeductionRepository.deleteByEntry(id, tx);
        const all = [
          ...autoDeductions.map((d) => ({
            incomeEntryId: id,
            description: d.description,
            amountCents: d.amountCents,
            isAutomatic: true,
            deductionType: d.deductionType ?? null,
          })),
          ...newCustomDeductions.map((d) => ({
            incomeEntryId: id,
            description: d.description,
            amountCents: d.amountCents,
            isAutomatic: false,
            deductionType: null as null,
          })),
        ];
        if (all.length > 0) {
          await this.incomeDeductionRepository.createMany(all, tx);
        }
      } else {
        // Replace auto deductions only; custom deductions remain untouched
        await this.incomeDeductionRepository.deleteAutoByEntry(id, tx);
        if (autoDeductions.length > 0) {
          await this.incomeDeductionRepository.createMany(
            autoDeductions.map((d) => ({
              incomeEntryId: id,
              description: d.description,
              amountCents: d.amountCents,
              isAutomatic: true,
              deductionType: d.deductionType ?? null,
            })),
            tx,
          );
        }
      }

      await this.incomeRepository.update(
        id,
        {
          grossCents: newGrossCents,
          netCents: newNetCents,
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        },
        tx,
      );

      // Update the linked income transaction amount
      await tx.transaction.updateMany({
        where: { incomeEntryId: id, deletedAt: null },
        data: { amountCents: newNetCents },
      });
    });

    const full = await this.incomeRepository.findById(id, userId);
    if (!full) throw new EntityNotFoundException('IncomeEntry', id);
    return full;
  }

  async findAll(userId: string): Promise<IncomeEntryWithDeductions[]> {
    return this.incomeRepository.findAllByUser(userId);
  }

  async findById(id: string, userId: string): Promise<IncomeEntryWithDeductions> {
    const entry = await this.incomeRepository.findById(id, userId);
    if (!entry) throw new EntityNotFoundException('IncomeEntry', id);
    return entry;
  }

  async remove(id: string, userId: string): Promise<void> {
    const entry = await this.incomeRepository.findById(id, userId);
    if (!entry) throw new EntityNotFoundException('IncomeEntry', id);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.incomeRepository.softDelete(id, tx);
      // soft-delete the linked income transaction
      await tx.transaction.updateMany({
        where: { incomeEntryId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface AutoDeduction {
  description: string;
  amountCents: bigint;
  deductionType?: string;
}

function buildAutoDeductions(breakdown: TaxBreakdown | null): AutoDeduction[] {
  if (!breakdown) return [];
  const deductions: AutoDeduction[] = [];
  if (breakdown.inssCents > 0n) {
    deductions.push({
      description: 'INSS',
      amountCents: breakdown.inssCents,
      deductionType: 'INSS',
    });
  }
  if (breakdown.irrfCents > 0n) {
    deductions.push({
      description: 'IRRF',
      amountCents: breakdown.irrfCents,
      deductionType: 'IRRF',
    });
  }
  return deductions;
}
