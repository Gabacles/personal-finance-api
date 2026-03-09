"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding deduction tables (2026)...');
    const inssBrackets2026 = [
        { upToCents: 162_100, rateBps: 750 },
        { upToCents: 290_284, rateBps: 900 },
        { upToCents: 435_427, rateBps: 1200 },
        { upToCents: 847_555, rateBps: 1400 },
        { upToCents: null, rateBps: null },
    ];
    await prisma.deductionTable.upsert({
        where: { type_validForYear: { type: 'INSS', validForYear: 2026 } },
        update: { validForYear: 2026, brackets: inssBrackets2026 },
        create: { type: 'INSS', validForYear: 2026, brackets: inssBrackets2026 },
    });
    const irrfBrackets2026 = [
        { upToCents: 242_880, rateBps: 0, deductionCents: 0 },
        { upToCents: 282_665, rateBps: 750, deductionCents: 18_216 },
        { upToCents: 375_105, rateBps: 1500, deductionCents: 39_416 },
        { upToCents: 466_468, rateBps: 2250, deductionCents: 67_549 },
        { upToCents: null, rateBps: 2750, deductionCents: 90_873 },
    ];
    const irrfMeta2026 = {
        reductionThreshold1Cents: 500_000,
        reductionThreshold2Cents: 735_000,
        reductionFixedCents: 97_862,
        reductionRatePer1M: 133_145,
    };
    await prisma.deductionTable.upsert({
        where: { type_validForYear: { type: 'IRRF', validForYear: 2026 } },
        update: { validForYear: 2026, brackets: irrfBrackets2026, meta: irrfMeta2026 },
        create: { type: 'IRRF', validForYear: 2026, brackets: irrfBrackets2026, meta: irrfMeta2026 },
    });
    console.log('Deduction tables seeded successfully.');
}
main()
    .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
})
    .finally(() => {
    void prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map