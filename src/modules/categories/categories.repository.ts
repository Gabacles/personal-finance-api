import { Injectable } from '@nestjs/common';
import { Category, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(data: Prisma.CategoryCreateManyInput[]): Promise<void> {
    await this.prisma.category.createMany({ data });
  }

  async createUserCategory(data: {
    userId: string;
    name: string;
    type: TransactionType;
  }): Promise<Category> {
    return this.prisma.category.create({
      data: { ...data, isSystem: false },
    });
  }

  async findAllForUser(userId: string, type?: TransactionType): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        deletedAt: null,
        OR: [{ userId }, { isSystem: true }],
        ...(type && { type }),
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async updateName(id: string, name: string): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data: { name } });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async countUsage(id: string): Promise<number> {
    const [txns, recurring] = await Promise.all([
      this.prisma.transaction.count({ where: { categoryId: id, deletedAt: null } }),
      this.prisma.recurringTransaction.count({ where: { categoryId: id, deletedAt: null } }),
    ]);
    return txns + recurring;
  }
}
