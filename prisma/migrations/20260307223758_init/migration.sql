-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('CLT', 'PJ', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EXPENSE', 'INCOME');

-- CreateEnum
CREATE TYPE "TransactionOrigin" AS ENUM ('ONE_TIME', 'INSTALLMENT', 'RECURRING', 'INCOME');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DeductionTableType" AS ENUM ('INSS', 'IRRF');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "employment_type" "EmploymentType" NOT NULL DEFAULT 'CLT',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" TEXT NOT NULL,
    "payment_method_id" TEXT NOT NULL,
    "closing_day" INTEGER NOT NULL,
    "due_day" INTEGER NOT NULL,
    "credit_limit_cents" BIGINT,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT,
    "payment_method_id" TEXT,
    "installment_plan_id" TEXT,
    "recurring_transaction_id" TEXT,
    "income_entry_id" TEXT,
    "description" VARCHAR(255) NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "origin" "TransactionOrigin" NOT NULL,
    "reference_month" CHAR(7) NOT NULL,
    "transaction_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installment_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "payment_method_id" TEXT NOT NULL,
    "category_id" TEXT,
    "description" VARCHAR(255) NOT NULL,
    "total_amount_cents" BIGINT NOT NULL,
    "installment_count" INTEGER NOT NULL,
    "first_reference_month" CHAR(7) NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "purchase_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "installment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT,
    "payment_method_id" TEXT,
    "description" VARCHAR(255) NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "day_of_month" INTEGER,
    "start_month" CHAR(7) NOT NULL,
    "end_month" CHAR(7),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reference_month" CHAR(7) NOT NULL,
    "gross_cents" BIGINT NOT NULL,
    "net_cents" BIGINT NOT NULL,
    "employment_type" "EmploymentType" NOT NULL,
    "description" VARCHAR(255) NOT NULL DEFAULT 'Salário',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "income_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_deductions" (
    "id" TEXT NOT NULL,
    "income_entry_id" TEXT NOT NULL,
    "description" VARCHAR(100) NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "is_automatic" BOOLEAN NOT NULL DEFAULT false,
    "deduction_type" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_deductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deduction_tables" (
    "id" TEXT NOT NULL,
    "type" "DeductionTableType" NOT NULL,
    "valid_for_year" INTEGER NOT NULL,
    "brackets" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deduction_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_budgets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reference_month" CHAR(7) NOT NULL,
    "total_budget_cents" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "monthly_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_allocations" (
    "id" TEXT NOT NULL,
    "monthly_budget_id" TEXT NOT NULL,
    "category_id" TEXT,
    "label" VARCHAR(100) NOT NULL,
    "allocated_cents" BIGINT NOT NULL,

    CONSTRAINT "budget_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "categories_user_id_idx" ON "categories"("user_id");

-- CreateIndex
CREATE INDEX "payment_methods_user_id_idx" ON "payment_methods"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "credit_cards_payment_method_id_key" ON "credit_cards"("payment_method_id");

-- CreateIndex
CREATE INDEX "idx_txn_user_refmonth" ON "transactions"("user_id", "reference_month");

-- CreateIndex
CREATE INDEX "transactions_user_id_type_idx" ON "transactions"("user_id", "type");

-- CreateIndex
CREATE INDEX "transactions_installment_plan_id_idx" ON "transactions"("installment_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_recurring_transaction_id_reference_month_key" ON "transactions"("recurring_transaction_id", "reference_month");

-- CreateIndex
CREATE INDEX "installment_plans_user_id_idx" ON "installment_plans"("user_id");

-- CreateIndex
CREATE INDEX "installment_plans_payment_method_id_idx" ON "installment_plans"("payment_method_id");

-- CreateIndex
CREATE INDEX "recurring_transactions_user_id_is_active_idx" ON "recurring_transactions"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "income_entries_user_id_reference_month_idx" ON "income_entries"("user_id", "reference_month");

-- CreateIndex
CREATE UNIQUE INDEX "income_entries_user_id_reference_month_key" ON "income_entries"("user_id", "reference_month");

-- CreateIndex
CREATE INDEX "income_deductions_income_entry_id_idx" ON "income_deductions"("income_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "deduction_tables_type_valid_for_year_key" ON "deduction_tables"("type", "valid_for_year");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_budgets_user_id_reference_month_key" ON "monthly_budgets"("user_id", "reference_month");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_installment_plan_id_fkey" FOREIGN KEY ("installment_plan_id") REFERENCES "installment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_transaction_id_fkey" FOREIGN KEY ("recurring_transaction_id") REFERENCES "recurring_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_income_entry_id_fkey" FOREIGN KEY ("income_entry_id") REFERENCES "income_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_deductions" ADD CONSTRAINT "income_deductions_income_entry_id_fkey" FOREIGN KEY ("income_entry_id") REFERENCES "income_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_budgets" ADD CONSTRAINT "monthly_budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_monthly_budget_id_fkey" FOREIGN KEY ("monthly_budget_id") REFERENCES "monthly_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
