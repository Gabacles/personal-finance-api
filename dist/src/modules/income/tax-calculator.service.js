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
exports.TaxCalculatorService = void 0;
exports.calcInss = calcInss;
exports.calcIrrf = calcIrrf;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const domain_exceptions_1 = require("../../shared/exceptions/domain.exceptions");
const prisma_service_1 = require("../../shared/database/prisma.service");
const DEPENDENT_ALLOWANCE_CENTS = 24274n;
let TaxCalculatorService = class TaxCalculatorService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async computeCLT(grossCents, year, dependents = 0) {
        const [inssRow, irrfRow] = await Promise.all([
            this.prisma.deductionTable.findUnique({
                where: { type_validForYear: { type: client_1.DeductionTableType.INSS, validForYear: year } },
            }),
            this.prisma.deductionTable.findUnique({
                where: { type_validForYear: { type: client_1.DeductionTableType.IRRF, validForYear: year } },
            }),
        ]);
        if (!inssRow)
            throw new domain_exceptions_1.EntityNotFoundException('DeductionTable', `INSS/${year}`);
        if (!irrfRow)
            throw new domain_exceptions_1.EntityNotFoundException('DeductionTable', `IRRF/${year}`);
        const inssBrackets = inssRow.brackets;
        const irrfBrackets = irrfRow.brackets;
        const irrfMeta = irrfRow.meta;
        const { inssCents, inssSlices } = calcInss(grossCents, inssBrackets);
        const dependentAllowanceTotalCents = BigInt(dependents) * DEPENDENT_ALLOWANCE_CENTS;
        const { irrfCents, irrfDetail } = calcIrrf(grossCents, inssCents, dependentAllowanceTotalCents, irrfBrackets, irrfMeta ?? undefined);
        const netCents = grossCents - inssCents - irrfCents;
        return {
            grossCents,
            inssCents,
            irrfCents,
            dependentAllowanceTotalCents,
            netCents,
            inssSlices,
            irrfDetail,
        };
    }
};
exports.TaxCalculatorService = TaxCalculatorService;
exports.TaxCalculatorService = TaxCalculatorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaxCalculatorService);
function calcInss(grossCents, brackets) {
    let prevCeiling = 0n;
    let inssCents = 0n;
    const inssSlices = [];
    for (const bracket of brackets) {
        if (bracket.rateBps === null)
            break;
        const ceiling = bracket.upToCents !== null ? BigInt(bracket.upToCents) : grossCents;
        const appliedToCents = sliceInRange(grossCents, prevCeiling, ceiling);
        if (appliedToCents <= 0n)
            break;
        const rateBps = BigInt(bracket.rateBps);
        const contributionCents = (appliedToCents * rateBps) / 10000n;
        inssCents += contributionCents;
        inssSlices.push({ rateBps: bracket.rateBps, appliedToCents, contributionCents });
        prevCeiling = ceiling;
        if (grossCents <= ceiling)
            break;
    }
    return { inssCents, inssSlices };
}
function calcIrrf(grossCents, inssCents, dependentAllowanceTotalCents, brackets, meta) {
    const taxableBasisCents = grossCents - inssCents - dependentAllowanceTotalCents;
    if (taxableBasisCents <= 0n) {
        return {
            irrfCents: 0n,
            irrfDetail: {
                taxableBasisCents: 0n,
                rateBps: 0,
                deductionAppliedCents: 0n,
                monthlyReductionCents: 0n,
                totalCents: 0n,
            },
        };
    }
    const bracket = brackets.find((b) => b.upToCents === null || taxableBasisCents <= BigInt(b.upToCents)) ?? brackets[brackets.length - 1];
    if (bracket.rateBps === 0) {
        return {
            irrfCents: 0n,
            irrfDetail: {
                taxableBasisCents,
                rateBps: 0,
                deductionAppliedCents: 0n,
                monthlyReductionCents: 0n,
                totalCents: 0n,
            },
        };
    }
    const rateBps = BigInt(bracket.rateBps);
    const deductionApplied = BigInt(bracket.deductionCents);
    const grossIrrf = (taxableBasisCents * rateBps) / 10000n;
    let irrfBase = grossIrrf > deductionApplied ? grossIrrf - deductionApplied : 0n;
    let monthlyReductionCents = 0n;
    if (meta && irrfBase > 0n) {
        const t1 = BigInt(meta.reductionThreshold1Cents);
        const t2 = BigInt(meta.reductionThreshold2Cents);
        if (taxableBasisCents <= t1) {
            monthlyReductionCents = irrfBase;
            irrfBase = 0n;
        }
        else if (taxableBasisCents <= t2) {
            const fixedCents = BigInt(meta.reductionFixedCents);
            const ratePer1M = BigInt(meta.reductionRatePer1M);
            const variablePart = (ratePer1M * taxableBasisCents) / 1000000n;
            const reductionAmount = fixedCents > variablePart ? fixedCents - variablePart : 0n;
            monthlyReductionCents = reductionAmount < irrfBase ? reductionAmount : irrfBase;
            irrfBase = irrfBase - monthlyReductionCents;
        }
    }
    return {
        irrfCents: irrfBase,
        irrfDetail: {
            taxableBasisCents,
            rateBps: bracket.rateBps,
            deductionAppliedCents: deductionApplied,
            monthlyReductionCents,
            totalCents: irrfBase,
        },
    };
}
function sliceInRange(value, from, to) {
    if (value <= from)
        return 0n;
    const effective = value < to ? value : to;
    return effective - from;
}
//# sourceMappingURL=tax-calculator.service.js.map