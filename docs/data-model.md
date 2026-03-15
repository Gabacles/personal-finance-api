# Data Model

## Design Principles

The relational model is governed by four principles:

1. **Own what you write.** Each domain module owns a specific set of tables. No module writes to another module's tables directly.
2. **Immutable history.** Financial records are never hard-deleted and never mutated in ways that would corrupt historical reporting. Soft deletes, snapshots, and append-only deduction rows enforce this.
3. **Derived data stays derived.** Values that can be reliably computed from stored data at query time are not stored — unless the computation requires information that may change (e.g., tax rates), in which case the result is materialized at write time.
4. **The index is part of the design.** For a query-heavy system like this, index design is not an afterthought. The primary read patterns are identified first; indexes are designed alongside the tables.

---

## Enums

Enums are defined as PostgreSQL-level types. Prisma maps these to native `enum` declarations in migrations.

```
EmploymentType     = CLT | PJ | OTHER
PaymentMethodType  = CREDIT_CARD | PIX | CASH | DEBIT | BOLETO
TransactionType    = EXPENSE | INCOME
CategoryType       = EXPENSE | INCOME | INVESTMENT
RecurrenceType     = MONTHLY
InstallmentStatus  = ACTIVE | CANCELLED | COMPLETED
DeductionTableType = INSS | IRRF
```

**Extension notes:**
- `TransactionType` will gain `INVESTMENT`, `REFUND`, and `TRANSFER` in v1.1 — adding enum values is a non-destructive migration
- `RecurrenceType` will gain `WEEKLY`, `BIWEEKLY`, and `ANNUAL` in v1.1
- `PaymentMethodType` already contains all anticipated values; activating them requires only business logic, not schema changes

---

## Tables

---

### `users`

The root entity. Every financial record in the system traces ownership back to a user row.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK, `gen_random_uuid()` | |
| `email` | `VARCHAR(255)` | NOT NULL | Partial unique index (see below) |
| `password_hash` | `VARCHAR(255)` | NOT NULL | bcrypt or argon2 output |
| `name` | `VARCHAR(150)` | NOT NULL | |
| `employment_type` | `EmploymentType` | NOT NULL | Determines income deduction strategy |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `deleted_at` | `TIMESTAMPTZ` | NULL | Soft delete |

**Indexes:**
- `UNIQUE (email) WHERE deleted_at IS NULL` — partial unique index; allows re-registration after soft delete without conflicting on archived email

**Design decision:** No `timezone` column in MVP. All date logic assumes `America/Sao_Paulo`. Adding a timezone field later is a non-breaking nullable-column migration.

---

### `categories`

Reference data used by all transaction modules. Supports both system-defined categories (global, `user_id IS NULL`) and user-defined categories (scoped to one user).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → `users.id`, NULL | NULL = system-defined |
| `parent_id` | `UUID` | FK → `categories.id`, NULL | Self-referential; NULL = root |
| `name` | `VARCHAR(100)` | NOT NULL | |
| `type` | `CategoryType` | NOT NULL | |
| `icon` | `VARCHAR(50)` | NULL | For frontend rendering |
| `is_system` | `BOOLEAN` | NOT NULL, default `false` | System categories are immutable |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `deleted_at` | `TIMESTAMPTZ` | NULL | |

**Constraints:**
- `CHECK (parent_id != id)` — a category cannot be its own parent
- `UNIQUE (user_id, parent_id, name) WHERE deleted_at IS NULL` — name uniqueness within the same parent and user scope

**Indexes:**
- `idx_categories_user_id` — filter for "my categories" listing
- `idx_categories_type` — filter by EXPENSE/INCOME when populating dropdowns
- `idx_categories_parent_id` — tree traversal

**Design decision:** The `parent_id` column exists from the first migration even though user-defined category creation is a v1.1 feature. The column is always-null for MVP data, but the schema accepts the hierarchy without modification when v1.1 ships.

---

### `payment_methods`

Abstract representation of a payment instrument. All transaction types reference this table rather than a specific instrument type such as a credit card, preventing the transactions table from accumulating conditional foreign keys.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL | |
| `type` | `PaymentMethodType` | NOT NULL | |
| `label` | `VARCHAR(100)` | NOT NULL | User-assigned name |
| `is_active` | `BOOLEAN` | NOT NULL, default `true` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `deleted_at` | `TIMESTAMPTZ` | NULL | |

**Indexes:**
- `idx_payment_methods_user_id`
- `idx_payment_methods_user_type` on `(user_id, type)`

---

### `credit_cards`

A 1:1 extension of `payment_methods` containing credit-card-specific configuration. Fields here are irrelevant and absent for other payment method types.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK | |
| `payment_method_id` | `UUID` | FK → `payment_methods.id`, NOT NULL, UNIQUE | 1:1 enforced |
| `closing_day` | `SMALLINT` | NOT NULL | |
| `due_day` | `SMALLINT` | NOT NULL | |
| `limit_cents` | `BIGINT` | NOT NULL | |
| `currency` | `CHAR(3)` | NOT NULL, default `'BRL'` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `deleted_at` | `TIMESTAMPTZ` | NULL | |

**Constraints:**
- `CHECK (closing_day BETWEEN 1 AND 28)` — avoids month-length ambiguity (no day 29, 30, or 31)
- `CHECK (due_day BETWEEN 1 AND 28)` — same rationale
- `CHECK (limit_cents > 0)`
- `UNIQUE (payment_method_id)` — enforces the 1:1 relationship at the database level

**Why a separate table instead of nullable columns on `payment_methods`:**
Adding `closing_day`, `due_day`, and `limit_cents` directly to `payment_methods` would produce always-null columns for every non-card payment method type, and any constraint on those columns would require a condition on `type`. As new payment types are added in v1.1, each gets its own 1:1 extension table using the same pattern as `credit_cards`.

---

### `transactions`

The central ledger. Every money movement in the system materializes as a row here, regardless of its origin — one-time purchase, installment charge, recurring subscription, or income.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL | Denormalized for query performance |
| `type` | `TransactionType` | NOT NULL | |
| `description` | `VARCHAR(255)` | NOT NULL | |
| `amount_cents` | `BIGINT` | NOT NULL | Always positive; direction is conveyed by `type` |
| `currency` | `CHAR(3)` | NOT NULL, default `'BRL'` | |
| `transaction_date` | `DATE` | NOT NULL | When the event physically occurred |
| `reference_month` | `CHAR(7)` | NOT NULL | `YYYY-MM` — the accounting period; immutable after creation |
| `category_id` | `UUID` | FK → `categories.id`, NOT NULL | |
| `payment_method_id` | `UUID` | FK → `payment_methods.id`, NULL | NULL for income and untracked cash |
| `installment_plan_id` | `UUID` | FK → `installment_plans.id`, NULL | |
| `installment_number` | `SMALLINT` | NULL | e.g. 3 (of 12) |
| `recurring_transaction_id` | `UUID` | FK → `recurring_transactions.id`, NULL | Template that generated this row |
| `income_entry_id` | `UUID` | FK → `income_entries.id`, NULL | Corresponding income entry |
| `notes` | `TEXT` | NULL | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `deleted_at` | `TIMESTAMPTZ` | NULL | |

**Constraints:**
- `CHECK (amount_cents > 0)`
- `CHECK ((installment_plan_id IS NULL) = (installment_number IS NULL))` — both must be set together or both null
- `CHECK (reference_month ~ '^\d{4}-(0[1-9]|1[0-2])$')` — format validation at the database level

**Indexes:**

| Index | Definition | Purpose |
|---|---|---|
| `idx_txn_user_refmonth` | `(user_id, reference_month) WHERE deleted_at IS NULL` | **Primary query path** for all monthly aggregations |
| `idx_txn_user_type_refmonth` | `(user_id, type, reference_month) WHERE deleted_at IS NULL` | Separate income from expenses in summary queries |
| `idx_txn_user_category_refmonth` | `(user_id, category_id, reference_month) WHERE deleted_at IS NULL` | Category breakdown in monthly summary |
| `idx_txn_payment_method_refmonth` | `(payment_method_id, reference_month) WHERE deleted_at IS NULL` | Credit card statement queries |
| `idx_txn_installment_plan` | `(installment_plan_id) WHERE deleted_at IS NULL` | Load all installments for a plan |
| `idx_txn_recurring_refmonth` | `UNIQUE (recurring_transaction_id, reference_month) WHERE deleted_at IS NULL` | **Idempotency guard** for lazy recurring generation |
| `idx_txn_user_date` | `(user_id, transaction_date) WHERE deleted_at IS NULL` | Date-range queries |

All indexes use partial conditions (`WHERE deleted_at IS NULL`) to exclude soft-deleted rows, keeping index size proportional to active data only.

**Why `user_id` is denormalized:**
Every transaction query starts with `WHERE user_id = X`. Deriving it via a join through `payment_method_id` or `category_id` would add a join to the highest-volume table in the system. The denormalization is intentional and correct.

**Why `reference_month` is `CHAR(7)` and not `DATE`:**
A reference month is a period concept, not a point in time. Storing it as a date (e.g., the first of the month) creates semantic ambiguity and temptation to perform day-level arithmetic on a month-granularity field. `CHAR(7)` with value `2026-03` is unambiguous, sorts correctly as a string, and is protected by the check constraint. The cost — a cast to `DATE` for month arithmetic in application code — is trivially handled in a service layer.

---

### `installment_plans`

Represents a purchase split into N future installments. The plan entity owns the parameters of the split; the individual installment charges are child `Transaction` rows.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL | |
| `payment_method_id` | `UUID` | FK → `payment_methods.id`, NOT NULL | |
| `category_id` | `UUID` | FK → `categories.id`, NOT NULL | |
| `description` | `VARCHAR(255)` | NOT NULL | |
| `total_amount_cents` | `BIGINT` | NOT NULL | Full purchase price |
| `installment_count` | `SMALLINT` | NOT NULL | |
| `installment_amount_cents` | `BIGINT` | NOT NULL | Per-installment value (last may differ) |
| `first_reference_month` | `CHAR(7)` | NOT NULL | `YYYY-MM` of installment 1 |
| `purchase_date` | `DATE` | NOT NULL | |
| `status` | `InstallmentStatus` | NOT NULL, default `'ACTIVE'` | |
| `currency` | `CHAR(3)` | NOT NULL, default `'BRL'` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `deleted_at` | `TIMESTAMPTZ` | NULL | |

**Constraints:**
- `CHECK (installment_count >= 2)` — single charges are plain transactions, not installment plans
- `CHECK (total_amount_cents > 0)`
- `CHECK (installment_amount_cents > 0)`
- `CHECK (first_reference_month ~ '^\d{4}-(0[1-9]|1[0-2])$')`

**Indexes:**
- `idx_installment_plans_user_status` on `(user_id, status) WHERE deleted_at IS NULL`
- `idx_installment_plans_payment_method` on `(payment_method_id) WHERE deleted_at IS NULL` — used to check open plans before deactivating a card

**Why `installment_amount_cents` is materialized:**
The per-installment amount (`floor(total / count)`) is computed at creation time and stored to avoid repeating the rounding logic on every read. The last installment's actual amount may differ and is determined by its `Transaction.amount_cents` row.

---

### `recurring_transactions`

Templates for repeating transactions. Generates one `Transaction` per active month through a lazy, idempotent mechanism.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL | |
| `type` | `TransactionType` | NOT NULL | |
| `description` | `VARCHAR(255)` | NOT NULL | |
| `amount_cents` | `BIGINT` | NOT NULL | Current value; historical transactions retain their amount |
| `currency` | `CHAR(3)` | NOT NULL, default `'BRL'` | |
| `category_id` | `UUID` | FK → `categories.id`, NOT NULL | |
| `payment_method_id` | `UUID` | FK → `payment_methods.id`, NULL | NULL for income-type recurrings |
| `recurrence_type` | `RecurrenceType` | NOT NULL, default `'MONTHLY'` | |
| `day_of_month` | `SMALLINT` | NULL | 1–28; used as the purchase day for statement month computation |
| `start_month` | `CHAR(7)` | NOT NULL | First active month |
| `end_month` | `CHAR(7)` | NULL | Last active month; NULL = indefinite |
| `is_active` | `BOOLEAN` | NOT NULL, default `true` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `deleted_at` | `TIMESTAMPTZ` | NULL | |

**Constraints:**
- `CHECK (amount_cents > 0)`
- `CHECK (day_of_month IS NULL OR day_of_month BETWEEN 1 AND 28)`
- `CHECK (end_month IS NULL OR end_month >= start_month)` — lexicographic comparison works correctly for `YYYY-MM`
- Format check constraints on `start_month` and `end_month`

**Indexes:**
- `idx_recurring_user_active` on `(user_id, is_active) WHERE deleted_at IS NULL` — primary lookup for the generation query
- `idx_recurring_user_type` on `(user_id, type) WHERE deleted_at IS NULL`

---

### `income_entries`

Structured income records with deduction context. Separate from the transactions table because deduction calculation complexity is domain logic that deserves its own entity, not a pile of nullable transaction columns.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL | |
| `reference_month` | `CHAR(7)` | NOT NULL | |
| `description` | `VARCHAR(255)` | NOT NULL | |
| `gross_amount_cents` | `BIGINT` | NOT NULL | |
| `employment_type` | `EmploymentType` | NOT NULL | Snapshotted from user at creation time |
| `dependents` | `SMALLINT` | NOT NULL, default `0` | |
| `currency` | `CHAR(3)` | NOT NULL, default `'BRL'` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `deleted_at` | `TIMESTAMPTZ` | NULL | |

**Constraints:**
- `CHECK (gross_amount_cents > 0)`
- `CHECK (dependents >= 0)`
- Format check constraint on `reference_month`

**Indexes:**
- `idx_income_entries_user_refmonth` on `(user_id, reference_month) WHERE deleted_at IS NULL`

**Why `employment_type` is snapshotted:**
If the user changes from CLT to PJ in June, their March income entry must still reflect the CLT deduction calculation that was applied at registration time. Storing the value on the entry prevents time-travel corruption.

---

### `income_deductions`

Individual deduction line items belonging to a single `income_entry`. Auto-calculated deductions (INSS, IRRF) and user-defined deductions (VR, VT, health plan) share this table, distinguished by `is_auto_calculated`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK | |
| `income_entry_id` | `UUID` | FK → `income_entries.id`, NOT NULL | |
| `name` | `VARCHAR(100)` | NOT NULL | e.g. "INSS", "IRRF", "VT" |
| `amount_cents` | `BIGINT` | NOT NULL | |
| `is_auto_calculated` | `BOOLEAN` | NOT NULL, default `false` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |

**Constraints:**
- `CHECK (amount_cents > 0)`

**Indexes:**
- `idx_income_deductions_entry` on `(income_entry_id)` — load full breakdown for an entry

**Why no `updated_at` or `deleted_at`:**
Deductions are never individually updated. When an income entry is edited, all its deductions are deleted and recreated (full-replacement strategy). This is simpler than tracking individual deduction mutations and correct for this use case.

---

### `deduction_tables`

Year-keyed progressive rate tables for INSS and IRRF. Updated annually via database seed migrations.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK | |
| `type` | `DeductionTableType` | NOT NULL | `INSS` or `IRRF` |
| `valid_for_year` | `SMALLINT` | NOT NULL | e.g. `2026` |
| `brackets` | `JSONB` | NOT NULL | Progressive bracket array |
| `dependent_deduction_cents` | `BIGINT` | NULL | Per-dependent allowance; IRRF only |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |

**Constraints:**
- `UNIQUE (type, valid_for_year)` — one table per deduction type per year
- `CHECK (valid_for_year >= 2020)` — sanity bound

**JSONB bracket format:**
```json
[
  { "min_cents": 0,      "max_cents": 141200, "rate": 0.075, "deduction_cents": 0     },
  { "min_cents": 141201, "max_cents": 266668, "rate": 0.09,  "deduction_cents": 2115  },
  { "min_cents": 266669, "max_cents": 400003, "rate": 0.12,  "deduction_cents": 10113 },
  { "min_cents": 400004, "max_cents": 782803, "rate": 0.14,  "deduction_cents": 18113 }
]
```

**Why JSONB:** Brackets are an atomic unit — they are always loaded together, never independently filtered or joined, and can be read as a single row fetch. A normalized `deduction_brackets` child table would add a join for zero benefit and complicate the seed migration.

---

### `monthly_budgets` *(v1.1 — schema created in MVP, no API endpoints)*

| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL |
| `reference_month` | `CHAR(7)` | NOT NULL |
| `total_limit_cents` | `BIGINT` | NOT NULL |
| `currency` | `CHAR(3)` | NOT NULL, default `'BRL'` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, `now()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, `now()` |
| `deleted_at` | `TIMESTAMPTZ` | NULL |

**Constraints:**
- `UNIQUE (user_id, reference_month) WHERE deleted_at IS NULL`
- `CHECK (total_limit_cents > 0)`

---

### `budget_allocations` *(v1.1)*

| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | PK |
| `monthly_budget_id` | `UUID` | FK → `monthly_budgets.id`, NOT NULL |
| `category_id` | `UUID` | FK → `categories.id`, NOT NULL |
| `limit_cents` | `BIGINT` | NOT NULL |

**Constraints:**
- `CHECK (limit_cents > 0)`
- `UNIQUE (monthly_budget_id, category_id)` — one allocation per category per budget

---

### `investment_plans` *(v1.1)*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL | |
| `reference_month` | `CHAR(7)` | NULL | NULL = standing monthly default |
| `strategy` | `VARCHAR(20)` | NOT NULL | `PERCENTAGE` or `FIXED_AMOUNT` |
| `value` | `INTEGER` | NOT NULL | Percentage (1–100) or cents depending on strategy |
| `currency` | `CHAR(3)` | NULL | Only relevant for `FIXED_AMOUNT` |
| `is_active` | `BOOLEAN` | NOT NULL, default `true` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, `now()` | |
| `deleted_at` | `TIMESTAMPTZ` | NULL | |

---

## Entity Relationship Overview

```
users
  │
  ├──< categories                  (user_id nullable; system categories have NULL)
  │       └──< categories          (parent_id self-reference)
  │
  ├──< payment_methods
  │       └──── credit_cards       (1:1 via payment_method_id UNIQUE)
  │
  ├──< transactions
  │       ├──> categories
  │       ├──> payment_methods     (nullable)
  │       ├──> installment_plans   (nullable)
  │       ├──> recurring_transactions (nullable)
  │       └──> income_entries      (nullable)
  │
  ├──< installment_plans
  │       ├──> payment_methods
  │       ├──> categories
  │       └──<── transactions      (N installment rows)
  │
  ├──< recurring_transactions
  │       ├──> categories
  │       ├──> payment_methods     (nullable)
  │       └──<── transactions      (generated occurrences)
  │
  ├──< income_entries
  │       ├──< income_deductions
  │       └──── transactions       (1:1 net income transaction)
  │
  ├──< monthly_budgets             (v1.1)
  │       └──< budget_allocations
  │
  └──< investment_plans            (v1.1)

deduction_tables                   (standalone reference data, no user FK)
```

---

## Stored vs Computed

### Materialized at Write Time (stored)

| Data | Rationale |
|---|---|
| `transactions.reference_month` | Derived from card closing day at write time; must be immutable and indexed |
| Individual installment transaction rows (N rows per plan) | Each is a real monthly charge that appears in a statement; not viable to compute lazily |
| `installment_plans.installment_amount_cents` | Avoids repeating `floor(total / count)` + rounding logic on every read |
| `income_entries.employment_type` | Snapshot; insulates historical records from future profile changes |
| `income_deductions` rows | Preserves the exact deduction breakdown that was used at calculation time, even as tax tables change annually |

### Computed at Query Time (not stored)

| Data | How |
|---|---|
| Transaction due date | `TO_DATE(reference_month || '-' || credit_cards.due_day)` — trivial date construction |
| Net income per entry | `gross_amount_cents - SUM(income_deductions.amount_cents)` |
| Remaining installments / amount | `COUNT / SUM` of non-deleted transactions where `installment_plan_id = X AND reference_month > current` |
| Category spending totals | `SUM(amount_cents) GROUP BY category_id` on transactions |
| Credit card statement total | `SUM(amount_cents)` where `payment_method_id = X AND reference_month = requested_month` |
| Credit card committed limit | `SUM(amount_cents)` where `payment_method_id = X AND type = EXPENSE AND reference_month >= requested_month` |
| Monthly summary | `SUM / GROUP BY` aggregations over transactions for a reference month |
| Category percentages | `amount / total × 100` — application layer |
| Dashboard projection | Open installments + active recurring templates extrapolated forward |

### Candidates for Future Materialization

| Data | When to materialize | Mechanism |
|---|---|---|
| Monthly summary for closed months | When query time exceeds acceptable threshold on large datasets | Add `monthly_snapshots` table; populate via background job when a month is closed |
| Per-category spending per month | When multi-month trend charts appear | Materialized view or a denormalized `category_monthly_totals` table |
| Credit card statement totals | When statement PDF export or data export is added | Cache for closed months only; recompute for open months |

---

## Migrations That Would Be Painful If Modeled Wrong

### 1. `reference_month` missing or as a full `DATE`

Not having `reference_month` as an explicit, stored, indexed column means every monthly aggregation query requires calling the closing-day computation inline. The alternative — storing it as `DATE` (e.g., first of the month) — is ambiguous and leaks implementation details into every query. The `CHAR(7)` format is locked and non-negotiable.

### 2. No `user_id` on `transactions`

Adding `user_id` to a table that may eventually contain millions of rows requires a full table scan backfill and index rebuild. Since every transaction query is scoped by user, this column must exist and be indexed from the first row.

### 3. `INTEGER` instead of `BIGINT` for money

`INTEGER` caps at approximately R$ 21 million in cents. A single corporate credit card limit or a real estate transaction can exceed this. Changing a column type across a large table requires a full rewrite and index rebuild. `BIGINT` is the correct type regardless of expected user scale.

### 4. `credit_card_id` on `transactions` instead of `payment_method_id`

Adding PIX, debit, or cash in v1.1 would require adding new nullable FK columns to the transactions table for each type, or a refactor to the abstraction layer. The `payment_method_id` → `PaymentMethod` abstraction costs one extra join in MVP and saves a schema change affecting the most-written table in the system.

### 5. Installments as linked rows without an `InstallmentPlan` parent

Without a plan entity, cancellation means `DELETE WHERE group_id = X AND reference_month > now()`, which has no natural lifecycle state. Budget-vs-remaining queries have no anchor point. Partial return tracking is impossible. Adding the plan entity retroactively means migrating existing linked transaction rows into a newly created plan table — a backfill with complex rounding logic.

### 6. INSS/IRRF brackets hardcoded in application code

Annual table updates require a code deploy. Historical recalculation with period-correct rates is impossible. The `deduction_tables` approach means updates are seed-migration deploys (data changes only) and historical rate accuracy is guaranteed by the `valid_for_year` key.

### 7. Flat category model (no `parent_id`)

Retrofitting a `parent_id` self-reference onto a flat category table requires adding the column, updating existing system-category seeds, and migrating any application logic that assumed flat structure. The column exists from day one at zero functional cost in MVP.

---

## Table Count Summary

| Scope | Tables |
|---|---|
| **MVP — active** | `users`, `categories`, `payment_methods`, `credit_cards`, `transactions`, `installment_plans`, `recurring_transactions`, `income_entries`, `income_deductions` |
| **MVP — reference data** | `deduction_tables` |
| **v1.1 — schema-ready, no active endpoints** | `monthly_budgets`, `budget_allocations`, `investment_plans` |
| **Total** | 13 tables |

Ten tables are active in MVP. Three are created in the initial migration but not yet populated by the application layer. No structural migration is required to activate any of the v1.1 features listed in this document.
