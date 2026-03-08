"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const domain_exceptions_1 = require("../../shared/exceptions/domain.exceptions");
const categories_repository_1 = require("./categories.repository");
const SYSTEM_CATEGORIES = [
    { name: 'Alimentação', type: client_1.TransactionType.EXPENSE },
    { name: 'Transporte', type: client_1.TransactionType.EXPENSE },
    { name: 'Moradia', type: client_1.TransactionType.EXPENSE },
    { name: 'Saúde', type: client_1.TransactionType.EXPENSE },
    { name: 'Educação', type: client_1.TransactionType.EXPENSE },
    { name: 'Lazer', type: client_1.TransactionType.EXPENSE },
    { name: 'Vestuário', type: client_1.TransactionType.EXPENSE },
    { name: 'Assinaturas', type: client_1.TransactionType.EXPENSE },
    { name: 'Outros (despesa)', type: client_1.TransactionType.EXPENSE },
    { name: 'Salário', type: client_1.TransactionType.INCOME },
    { name: 'Freelance', type: client_1.TransactionType.INCOME },
    { name: 'Investimentos', type: client_1.TransactionType.INCOME },
    { name: 'Outros (receita)', type: client_1.TransactionType.INCOME },
];
let CategoriesService = class CategoriesService {
    constructor(categoriesRepository) {
        this.categoriesRepository = categoriesRepository;
    }
    async seedSystemCategories(userId) {
        await this.categoriesRepository.createMany(SYSTEM_CATEGORIES.map((c) => ({
            userId,
            name: c.name,
            type: c.type,
            isSystem: true,
        })));
    }
    async findAll(userId, type) {
        return this.categoriesRepository.findAllForUser(userId, type);
    }
    async create(userId, dto) {
        return this.categoriesRepository.createUserCategory({
            userId,
            name: dto.name,
            type: dto.type,
        });
    }
    async update(id, userId, dto) {
        const cat = await this.categoriesRepository.findById(id);
        if (!cat)
            throw new domain_exceptions_1.EntityNotFoundException('Category', id);
        if (cat.isSystem) {
            throw new domain_exceptions_1.BusinessRuleException('SYSTEM_CATEGORY_NOT_EDITABLE', 'System categories cannot be modified');
        }
        if (cat.userId !== userId)
            throw new domain_exceptions_1.EntityNotFoundException('Category', id);
        return this.categoriesRepository.updateName(id, dto.name);
    }
    async remove(id, userId) {
        const cat = await this.categoriesRepository.findById(id);
        if (!cat)
            throw new domain_exceptions_1.EntityNotFoundException('Category', id);
        if (cat.isSystem) {
            throw new domain_exceptions_1.BusinessRuleException('SYSTEM_CATEGORY_NOT_DELETABLE', 'System categories cannot be deleted');
        }
        if (cat.userId !== userId)
            throw new domain_exceptions_1.EntityNotFoundException('Category', id);
        const usageCount = await this.categoriesRepository.countUsage(id);
        if (usageCount > 0) {
            throw new domain_exceptions_1.BusinessRuleException('CATEGORY_IN_USE', 'Cannot delete a category that is referenced by active transactions or recurring rules');
        }
        await this.categoriesRepository.softDelete(id);
    }
    async validateOwnershipAndType(categoryId, userId, expectedType) {
        const category = await this.categoriesRepository.findById(categoryId);
        if (!category)
            throw new domain_exceptions_1.EntityNotFoundException('Category', categoryId);
        if (!category.isSystem && category.userId !== userId) {
            throw new domain_exceptions_1.EntityNotFoundException('Category', categoryId);
        }
        if (category.type !== expectedType) {
            throw new domain_exceptions_1.BusinessRuleException('CATEGORY_TYPE_MISMATCH', `Category type '${category.type}' does not match the expected type '${expectedType}'`);
        }
        return category;
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [categories_repository_1.CategoriesRepository])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map