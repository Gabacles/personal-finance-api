-- AlterTable
ALTER TABLE "recurring_transactions" ADD COLUMN     "apply_tax_deductions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dependents" INTEGER NOT NULL DEFAULT 0;
