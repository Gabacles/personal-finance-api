import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import { PrismaService } from '../../shared/database/prisma.service';
import { BudgetRepository, BudgetWithAllocations } from './budget.repository';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetService {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, dto: CreateBudgetDto): Promise<BudgetWithAllocations> {
    const existing = await this.budgetRepository.findByMonth(userId, dto.referenceMonth);
    if (existing) {
      throw new BusinessRuleException(
        'BUDGET_ALREADY_EXISTS',
        `A budget already exists for ${dto.referenceMonth}. Use PATCH /budgets/${dto.referenceMonth} to update it.`,
      );
    }

    const budget = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await this.budgetRepository.create(
        {
          userId,
          referenceMonth: dto.referenceMonth,
          totalBudgetCents: BigInt(dto.totalBudgetCents),
        },
        tx,
      );

      if (dto.allocations && dto.allocations.length > 0) {
        await this.budgetRepository.createAllocations(
          dto.allocations.map((a) => ({
            monthlyBudgetId: created.id,
            label: a.label,
            allocatedCents: BigInt(a.allocatedCents),
            categoryId: a.categoryId ?? null,
          })),
          tx,
        );
      }

      return created;
    });

    const full = await this.budgetRepository.findById(budget.id, userId);
    if (!full) throw new EntityNotFoundException('MonthlyBudget', budget.id);
    return full;
  }

  async findAll(userId: string): Promise<BudgetWithAllocations[]> {
    return this.budgetRepository.findAllByUser(userId);
  }

  async findByMonth(userId: string, month: string): Promise<BudgetWithAllocations> {
    const budget = await this.budgetRepository.findByMonth(userId, month);
    if (!budget) throw new EntityNotFoundException('MonthlyBudget', month);
    return budget;
  }

  async update(
    userId: string,
    month: string,
    dto: UpdateBudgetDto,
  ): Promise<BudgetWithAllocations> {
    const budget = await this.budgetRepository.findByMonth(userId, month);
    if (!budget) throw new EntityNotFoundException('MonthlyBudget', month);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (dto.totalBudgetCents !== undefined) {
        await this.budgetRepository.update(
          budget.id,
          { totalBudgetCents: BigInt(dto.totalBudgetCents) },
          tx,
        );
      }

      if (dto.allocations !== undefined) {
        await this.budgetRepository.deleteAllocations(budget.id, tx);
        if (dto.allocations.length > 0) {
          await this.budgetRepository.createAllocations(
            dto.allocations.map((a) => ({
              monthlyBudgetId: budget.id,
              label: a.label,
              allocatedCents: BigInt(a.allocatedCents),
              categoryId: a.categoryId ?? null,
            })),
            tx,
          );
        }
      }
    });

    const full = await this.budgetRepository.findById(budget.id, userId);
    if (!full) throw new EntityNotFoundException('MonthlyBudget', budget.id);
    return full;
  }

  async remove(userId: string, month: string): Promise<void> {
    const budget = await this.budgetRepository.findByMonth(userId, month);
    if (!budget) throw new EntityNotFoundException('MonthlyBudget', month);
    await this.budgetRepository.delete(budget.id);
  }
}
