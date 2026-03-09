import { Injectable } from '@nestjs/common';
import { Category, TransactionType } from '@prisma/client';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async findAll(userId: string, type?: TransactionType): Promise<Category[]> {
    return this.categoriesRepository.findAllForUser(userId, type);
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    return this.categoriesRepository.createUserCategory({
      userId,
      name: dto.name,
      type: dto.type,
    });
  }

  async update(id: string, userId: string, dto: UpdateCategoryDto): Promise<Category> {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat) throw new EntityNotFoundException('Category', id);
    if (cat.isSystem) {
      throw new BusinessRuleException(
        'SYSTEM_CATEGORY_NOT_EDITABLE',
        'System categories cannot be modified',
      );
    }
    if (cat.userId !== userId) throw new EntityNotFoundException('Category', id);
    return this.categoriesRepository.updateName(id, dto.name);
  }

  async remove(id: string, userId: string): Promise<void> {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat) throw new EntityNotFoundException('Category', id);
    if (cat.isSystem) {
      throw new BusinessRuleException(
        'SYSTEM_CATEGORY_NOT_DELETABLE',
        'System categories cannot be deleted',
      );
    }
    if (cat.userId !== userId) throw new EntityNotFoundException('Category', id);

    const usageCount = await this.categoriesRepository.countUsage(id);
    if (usageCount > 0) {
      throw new BusinessRuleException(
        'CATEGORY_IN_USE',
        'Cannot delete a category that is referenced by active transactions or recurring rules',
      );
    }

    await this.categoriesRepository.softDelete(id);
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
