import { Injectable } from '@nestjs/common';
import { Category, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(data: Prisma.CategoryCreateManyInput[]): Promise<void> {
    await this.prisma.category.createMany({ data });
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
}
