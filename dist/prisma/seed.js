"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding deduction tables (2026)...');
    await prisma.deductionTable.upsert({
        where: { type_validForYear: { type: 'INSS', validForYear: 2026 } },
        update: {},
        create: {
            type: 'INSS',
            validForYear: 2026,
            brackets: [
                { upToCents: 182_074, rateBps: 750 },
                { upToCents: 303_456, rateBps: 900 },
                { upToCents: 455_184, rateBps: 1200 },
                { upToCents: 908_850, rateBps: 1400 },
                { upToCents: null, rateBps: null },
            ],
        },
    });
    await prisma.deductionTable.upsert({
        where: { type_validForYear: { type: 'IRRF', validForYear: 2026 } },
        update: {},
        create: {
            type: 'IRRF',
            validForYear: 2026,
            brackets: [
                { upToCents: 259_600, rateBps: 0, deductionCents: 0 },
                { upToCents: 386_800, rateBps: 750, deductionCents: 19_470 },
                { upToCents: 514_100, rateBps: 1500, deductionCents: 48_480 },
                { upToCents: 641_500, rateBps: 2250, deductionCents: 87_033 },
                { upToCents: null, rateBps: 2750, deductionCents: 119_138 },
            ],
        },
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