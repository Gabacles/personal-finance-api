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
exports.IncomeService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const domain_exceptions_1 = require("../../shared/exceptions/domain.exceptions");
const prisma_service_1 = require("../../shared/database/prisma.service");
const users_service_1 = require("../users/users.service");
const transactions_service_1 = require("../transactions/transactions.service");
const tax_calculator_service_1 = require("./tax-calculator.service");
const income_deduction_repository_1 = require("./income-deduction.repository");
const income_repository_1 = require("./income.repository");
let IncomeService = class IncomeService {
    constructor(incomeRepository, incomeDeductionRepository, taxCalculatorService, usersService, transactionsService, prisma) {
        this.incomeRepository = incomeRepository;
        this.incomeDeductionRepository = incomeDeductionRepository;
        this.taxCalculatorService = taxCalculatorService;
        this.usersService = usersService;
        this.transactionsService = transactionsService;
        this.prisma = prisma;
    }
    async register(userId, dto) {
        const user = await this.usersService.findById(userId);
        const year = parseInt(dto.referenceMonth.slice(0, 4), 10);
        const grossCents = BigInt(dto.grossCents);
        const dependents = dto.dependents ?? 0;
        const existing = await this.incomeRepository.findByMonth(userId, dto.referenceMonth);
        if (existing) {
            throw new domain_exceptions_1.BusinessRuleException('INCOME_ALREADY_REGISTERED', `An income entry already exists for month ${dto.referenceMonth}`);
        }
        let taxBreakdown = null;
        if (user.employmentType === client_1.EmploymentType.CLT) {
            taxBreakdown = await this.taxCalculatorService.computeCLT(grossCents, year, dependents);
        }
        const autoDeductions = buildAutoDeductions(taxBreakdown);
        const customDeductions = (dto.customDeductions ?? []).map((d) => ({
            description: d.description,
            amountCents: BigInt(d.amountCents),
            isAutomatic: false,
        }));
        const totalDeductionCents = autoDeductions.reduce((s, d) => s + d.amountCents, 0n) +
            customDeductions.reduce((s, d) => s + d.amountCents, 0n);
        const netCents = grossCents - totalDeductionCents;
        if (netCents <= 0n) {
            throw new domain_exceptions_1.BusinessRuleException('NET_INCOME_NOT_POSITIVE', 'Net income after deductions must be greater than zero');
        }
        const entry = await this.prisma.$transaction(async (tx) => {
            const created = await this.incomeRepository.create({
                userId,
                referenceMonth: dto.referenceMonth,
                grossCents,
                netCents,
                employmentType: user.employmentType,
                description: dto.description ?? 'Salário',
                notes: dto.notes,
            }, tx);
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
                    deductionType: null,
                })),
            ];
            if (allDeductions.length > 0) {
                await this.incomeDeductionRepository.createMany(allDeductions, tx);
            }
            await this.transactionsService.createIncomeTransaction({
                userId,
                incomeEntryId: created.id,
                description: dto.description ?? 'Salário',
                amountCents: netCents,
                referenceMonth: dto.referenceMonth,
                transactionDate: new Date(),
                notes: dto.notes,
            }, tx);
            return created;
        });
        const full = await this.incomeRepository.findById(entry.id, userId);
        if (!full)
            throw new domain_exceptions_1.EntityNotFoundException('IncomeEntry', entry.id);
        return full;
    }
    async update(id, userId, dto) {
        const entry = await this.incomeRepository.findById(id, userId);
        if (!entry)
            throw new domain_exceptions_1.EntityNotFoundException('IncomeEntry', id);
        const newGrossCents = dto.grossCents !== undefined ? BigInt(dto.grossCents) : entry.grossCents;
        const dependents = dto.dependents ?? 0;
        const year = parseInt(entry.referenceMonth.slice(0, 4), 10);
        let taxBreakdown = null;
        if (entry.employmentType === client_1.EmploymentType.CLT) {
            taxBreakdown = await this.taxCalculatorService.computeCLT(newGrossCents, year, dependents);
        }
        const autoDeductions = buildAutoDeductions(taxBreakdown);
        const existingCustom = entry.deductions
            .filter((d) => !d.isAutomatic)
            .map((d) => ({ description: d.description, amountCents: d.amountCents }));
        const newCustomDeductions = (dto.customDeductions !== undefined ? dto.customDeductions : existingCustom).map((d) => ({
            description: d.description,
            amountCents: BigInt(d.amountCents),
            isAutomatic: false,
        }));
        const totalDeductionCents = autoDeductions.reduce((s, d) => s + d.amountCents, 0n) +
            newCustomDeductions.reduce((s, d) => s + d.amountCents, 0n);
        const newNetCents = newGrossCents - totalDeductionCents;
        if (newNetCents <= 0n) {
            throw new domain_exceptions_1.BusinessRuleException('NET_INCOME_NOT_POSITIVE', 'Net income after deductions must be greater than zero');
        }
        await this.prisma.$transaction(async (tx) => {
            if (dto.customDeductions !== undefined) {
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
                        deductionType: null,
                    })),
                ];
                if (all.length > 0) {
                    await this.incomeDeductionRepository.createMany(all, tx);
                }
            }
            else {
                await this.incomeDeductionRepository.deleteAutoByEntry(id, tx);
                if (autoDeductions.length > 0) {
                    await this.incomeDeductionRepository.createMany(autoDeductions.map((d) => ({
                        incomeEntryId: id,
                        description: d.description,
                        amountCents: d.amountCents,
                        isAutomatic: true,
                        deductionType: d.deductionType ?? null,
                    })), tx);
                }
            }
            await this.incomeRepository.update(id, {
                grossCents: newGrossCents,
                netCents: newNetCents,
                ...(dto.description !== undefined ? { description: dto.description } : {}),
                ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
            }, tx);
            await tx.transaction.updateMany({
                where: { incomeEntryId: id, deletedAt: null },
                data: { amountCents: newNetCents },
            });
        });
        const full = await this.incomeRepository.findById(id, userId);
        if (!full)
            throw new domain_exceptions_1.EntityNotFoundException('IncomeEntry', id);
        return full;
    }
    async findAll(userId) {
        return this.incomeRepository.findAllByUser(userId);
    }
    async findById(id, userId) {
        const entry = await this.incomeRepository.findById(id, userId);
        if (!entry)
            throw new domain_exceptions_1.EntityNotFoundException('IncomeEntry', id);
        return entry;
    }
};
exports.IncomeService = IncomeService;
exports.IncomeService = IncomeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [income_repository_1.IncomeRepository,
        income_deduction_repository_1.IncomeDeductionRepository,
        tax_calculator_service_1.TaxCalculatorService,
        users_service_1.UsersService,
        transactions_service_1.TransactionsService,
        prisma_service_1.PrismaService])
], IncomeService);
function buildAutoDeductions(breakdown) {
    if (!breakdown)
        return [];
    const deductions = [];
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
//# sourceMappingURL=income.service.js.map