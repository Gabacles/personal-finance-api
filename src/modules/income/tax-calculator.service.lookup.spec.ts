import { Test, TestingModule } from '@nestjs/testing';
import { DeductionTableType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { TaxCalculatorService } from './tax-calculator.service';

function makeTable(year: number, type: DeductionTableType) {
  return {
    type,
    validForYear: year,
    brackets:
      type === DeductionTableType.INSS
        ? [{ upToCents: null, rateBps: 1000 }]
        : [{ upToCents: null, rateBps: 0, deductionCents: 0 }],
    meta: null,
  };
}

describe('TaxCalculatorService lookup fallback', () => {
  let service: TaxCalculatorService;

  let prismaMock: {
    deductionTable: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      deductionTable: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxCalculatorService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<TaxCalculatorService>(TaxCalculatorService);
  });

  it('uses the exact deduction tables when the requested year exists', async () => {
    prismaMock.deductionTable.findUnique
      .mockResolvedValueOnce(makeTable(2026, DeductionTableType.INSS))
      .mockResolvedValueOnce(makeTable(2026, DeductionTableType.IRRF));

    const result = await service.computeCLT(100_000n, 2026, 0);

    expect(prismaMock.deductionTable.findUnique).toHaveBeenCalledTimes(2);
    expect(prismaMock.deductionTable.findFirst).not.toHaveBeenCalled();
    expect(result.inssCents).toBe(10_000n);
    expect(result.irrfCents).toBe(0n);
    expect(result.netCents).toBe(90_000n);
  });

  it('falls back to the latest available deduction tables when the requested year is missing', async () => {
    prismaMock.deductionTable.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prismaMock.deductionTable.findFirst
      .mockResolvedValueOnce(makeTable(2026, DeductionTableType.INSS))
      .mockResolvedValueOnce(makeTable(2026, DeductionTableType.IRRF));

    const result = await service.computeCLT(100_000n, 2027, 0);

    expect(prismaMock.deductionTable.findUnique).toHaveBeenCalledWith({
      where: {
        type_validForYear: {
          type: DeductionTableType.INSS,
          validForYear: 2027,
        },
      },
    });
    expect(prismaMock.deductionTable.findUnique).toHaveBeenCalledWith({
      where: {
        type_validForYear: {
          type: DeductionTableType.IRRF,
          validForYear: 2027,
        },
      },
    });
    expect(prismaMock.deductionTable.findFirst).toHaveBeenCalledTimes(2);
    expect(result.inssCents).toBe(10_000n);
    expect(result.irrfCents).toBe(0n);
    expect(result.netCents).toBe(90_000n);
  });
});