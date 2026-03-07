import { Injectable } from '@nestjs/common';
import { Category, TransactionType } from '@prisma/client';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import { CategoriesRepository } from './categories.repository';

const SYSTEM_CATEGORIES: Array<{ name: string; type: TransactionType }> = [
  { name: 'Alimentação', type: TransactionType.EXPENSE },
  { name: 'Transporte', type: TransactionType.EXPENSE },
  { name: 'Moradia', type: TransactionType.EXPENSE },
  { name: 'Saúde', type: TransactionType.EXPENSE },
  { name: 'Educação', type: TransactionType.EXPENSE },
  { name: 'Lazer', type: TransactionType.EXPENSE },
  { name: 'Vestuário', type: TransactionType.EXPENSE },
  { name: 'Assinaturas', type: TransactionType.EXPENSE },
  { name: 'Outros (despesa)', type: TransactionType.EXPENSE },
  { name: 'Salário', type: TransactionType.INCOME },
  { name: 'Freelance', type: TransactionType.INCOME },
  { name: 'Investimentos', type: TransactionType.INCOME },
  { name: 'Outros (receita)', type: TransactionType.INCOME },
];

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async seedSystemCategories(userId: string): Promise<void> {
    await this.categoriesRepository.createMany(
      SYSTEM_CATEGORIES.map((c) => ({
        userId,
        name: c.name,
        type: c.type,
        isSystem: true,
      })),
    );
  }

  async findAll(userId: string, type?: TransactionType): Promise<Category[]> {
    return this.categoriesRepository.findAllForUser(userId, type);
  }

  async validateOwnershipAndType(
    categoryId: string,
    userId: string,
    expectedType: TransactionType,
  ): Promise<Category> {
    const category = await this.categoriesRepository.findById(categoryId);
    if (!category) throw new EntityNotFoundException('Category', categoryId);

    if (!category.isSystem && category.userId !== userId) {
      throw new EntityNotFoundException('Category', categoryId);
    }

    if (category.type !== expectedType) {
      throw new BusinessRuleException(
        'CATEGORY_TYPE_MISMATCH',
        `Category type '${category.type}' does not match the expected type '${expectedType}'`,
      );
    }

    return category;
  }
}
