import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding deduction tables (2026)...');

  // INSS 2026 — progressive brackets (cumulative method)
  // Source: https://www.gov.br/secom/pt-br/acompanhe-a-secom/noticias/2026/01/nova-tabela-do-ir-veja-faixas-e-aliquotas-e-saiba-mais-sobre-medida-que-isenta-o-pagamento-para-quem-ganha-ate-r-5-mil
  const inssBrackets2026 = [
    { upToCents: 162_100, rateBps: 750 },       // up to R$1.621,00 → 7,5%
    { upToCents: 290_284, rateBps: 900 },       // R$1.621,01 – R$2.902,84 → 9,0%
    { upToCents: 435_427, rateBps: 1200 },      // R$2.902,85 – R$4.354,27 → 12,0%
    { upToCents: 847_555, rateBps: 1400 },      // R$4.354,28 – R$8.475,55 → 14,0%
    { upToCents: null, rateBps: null },          // above R$8.475,55 → contribution capped
  ];
  await prisma.deductionTable.upsert({
    where: { type_validForYear: { type: 'INSS', validForYear: 2026 } },
    update: { validForYear: 2026, brackets: inssBrackets2026 },
    create: { type: 'INSS', validForYear: 2026, brackets: inssBrackets2026 },
  });

  // IRRF 2026 — tabela base progressiva + redução mensal do imposto
  // Source: https://www.gov.br/secom/pt-br/acompanhe-a-secom/noticias/2026/01/nova-tabela-do-ir-veja-faixas-e-aliquotas-e-saiba-mais-sobre-medida-que-isenta-o-pagamento-para-quem-ganha-ate-r-5-mil
  //
  // Tabela base mensal (base de cálculo = bruto - INSS - deduções de dependentes):
  //   Até R$2.428,80           → 0%    | parcela R$0,00
  //   R$2.428,81 – R$2.826,65  → 7,5%  | parcela R$182,16
  //   R$2.826,66 – R$3.751,05  → 15%   | parcela R$394,16
  //   R$3.751,06 – R$4.664,68  → 22,5% | parcela R$675,49
  //   Acima de R$4.664,68      → 27,5% | parcela R$908,73
  //
  // Redução mensal do imposto (aplicada APÓS o cálculo da tabela base):
  //   Base tributável ≤ R$5.000,00                → redução total (IR = 0)
  //   R$5.000,01 ≤ base ≤ R$7.350,00             → redução parcial: R$978,62 - (0,133145 × base)
  //   Base tributável > R$7.350,00                → sem redução
  //
  // A redução é modelada como metadado à parte (reductionThreshold1Cents / reductionThreshold2Cents /
  // reductionFixedCents / reductionRateBps100k) no campo `meta` da tabela a fins de flexibilidade futura.
  // O service lê esses campos quando presentes.
  const irrfBrackets2026 = [
    { upToCents: 242_880, rateBps: 0,    deductionCents: 0      }, // exempt (até R$2.428,80)
    { upToCents: 282_665, rateBps: 750,  deductionCents: 18_216 }, // 7,5%  (parcela R$182,16)
    { upToCents: 375_105, rateBps: 1500, deductionCents: 39_416 }, // 15%   (parcela R$394,16)
    { upToCents: 466_468, rateBps: 2250, deductionCents: 67_549 }, // 22,5% (parcela R$675,49)
    { upToCents: null,    rateBps: 2750, deductionCents: 90_873 }, // 27,5% (parcela R$908,73)
  ];
  // Redução mensal: até 500_000 cents → IR = 0; entre 500_001 e 735_000 → IR = IR_bruto - (97_862 - 13_3145‰ × base)
  const irrfMeta2026 = {
    reductionThreshold1Cents: 500_000,  // até R$5.000,00 → IR zero
    reductionThreshold2Cents: 735_000,  // até R$7.350,00 → redução parcial
    reductionFixedCents: 97_862,        // R$978,62 em centavos
    reductionRatePer1M: 133_145,        // 0,133145 × 1_000_000 (inteiro para aritmética BigInt)
  };
  await prisma.deductionTable.upsert({
    where: { type_validForYear: { type: 'IRRF', validForYear: 2026 } },
    update: { validForYear: 2026, brackets: irrfBrackets2026, meta: irrfMeta2026 },
    create: { type: 'IRRF', validForYear: 2026, brackets: irrfBrackets2026, meta: irrfMeta2026 },
  });

  console.log('Deduction tables seeded successfully.');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
