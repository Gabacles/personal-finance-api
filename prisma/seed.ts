import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding deduction tables (2026)...');

  // INSS 2026 — progressive brackets (cumulative method)
  // Source: Official Brazilian INSS table for 2026 (approximate/projected values)
  await prisma.deductionTable.upsert({
    where: { type_validForYear: { type: 'INSS', validForYear: 2026 } },
    update: {},
    create: {
      type: 'INSS',
      validForYear: 2026,
      brackets: [
        { upToCents: 182_074, rateBps: 750 },       // up to R$1,820.74 → 7.5%
        { upToCents: 303_456, rateBps: 900 },       // R$1,820.75 – R$3,034.56 → 9.0%
        { upToCents: 455_184, rateBps: 1200 },      // R$3,034.57 – R$4,551.84 → 12.0%
        { upToCents: 908_850, rateBps: 1400 },      // R$4,551.85 – R$9,088.50 → 14.0%
        { upToCents: null, rateBps: null },          // above R$9,088.50 → contribution capped
      ],
      // maxContributionCents: 127_239 (14% of ceiling — approx.)
    },
  });

  // IRRF 2026 — progressive brackets (on taxable basis after INSS deduction)
  // Source: Official Brazilian IRRF table for 2026 (approximate/projected values)
  await prisma.deductionTable.upsert({
    where: { type_validForYear: { type: 'IRRF', validForYear: 2026 } },
    update: {},
    create: {
      type: 'IRRF',
      validForYear: 2026,
      brackets: [
        { upToCents: 259_600, rateBps: 0, deductionCents: 0 },         // exempt
        { upToCents: 386_800, rateBps: 750, deductionCents: 19_470 },   // 7.5%
        { upToCents: 514_100, rateBps: 1500, deductionCents: 48_480 },  // 15%
        { upToCents: 641_500, rateBps: 2250, deductionCents: 87_033 },  // 22.5%
        { upToCents: null, rateBps: 2750, deductionCents: 119_138 },    // 27.5%
        // dependentAllowanceCents: 18_959 per dependent per month (2026 approx.)
      ],
    },
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
