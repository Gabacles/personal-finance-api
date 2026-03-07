# Domain Overview

## Product Vision

Personal Finance API is a **monthly cash flow management system** designed for the Brazilian financial context. It is not a simple expense tracker — it is a structured, forward-looking financial ledger that helps users understand where their money goes, plan ahead, and build sustainable financial habits over time.

The system is built around one foundational concept: every money movement belongs to a **reference month** — the accounting period that owns that transaction for reporting and aggregation purposes. This period is often different from the physical date the event occurred, particularly for credit card purchases, installment plans, and subscription billing cycles.

Three distinct timelines coexist throughout the domain:

| Timeline | Description |
|---|---|
| **Event date** | When the transaction physically occurred |
| **Statement month** | Which credit card billing cycle (YYYY-MM) it falls into, determined by the card's closing day |
| **Reference month** | The accounting period that owns the transaction for reporting |

For direct (non-card) transactions, all three are the same. For credit card purchases, they diverge — and correctly modeling this distinction is the most critical architectural decision in the entire system.

---

## Domain Modules

The application is composed of bounded contexts, each owning a distinct set of entities and business logic. Modules are designed so that read-only reporting concerns are fully separated from transactional domain ownership.

### Identity
Manages user accounts, authentication, and employment profile. The employment type (`CLT`, `PJ`, `OTHER`) declared here drives every income deduction calculation downstream.

### Payment Methods
Manages payment instruments. Credit cards are a specialization that carry additional configuration: a **closing day** (which determines when a billing cycle ends) and a **due day** (which determines when the statement balance is due). This module owns the authoritative statement month computation algorithm.

### Categories
Provides the classification axis for all financial movements. Supports system-defined categories (seeded on user registration) and user-defined categories with a two-level hierarchy. Treated as shared reference data — every transaction module depends on it, but none owns it exclusively.

### Transactions
The core ledger. Every money movement — credit card purchase, direct expense, income, installment charge, recurring charge — materializes as a row in the transactions table. This module owns the table and is the **single writer**. All other domain modules delegate transaction creation to this module's service layer.

### Installment Plans
Manages split purchases. An installment plan is not itself a transaction — it is a plan entity that generates N child transactions, one per statement month. This module owns plan creation, the installment distribution algorithm, and the cancellation lifecycle.

### Recurring Transactions
Manages reusable templates for repeating financial events: subscriptions (Netflix, Spotify), fixed expenses (rent, gym, therapy), and income sources (salary). Templates are distinct from their materializations. The module generates transaction records idempotently for any requested reference month.

### Income
Manages income entries with structured deduction breakdowns. For CLT employees, INSS and IRRF are calculated automatically from year-keyed progressive rate tables stored in the database. Deduction line items are persisted individually for historical accuracy.

### Budgets *(v1.1)*
Manages monthly spending caps and per-category allocations. Provides budget-vs-actual comparison as a read operation over the transaction ledger.

### Reporting
A read-only aggregation layer that composes data from all transactional modules. Includes monthly summaries and a forward-looking dashboard. This layer owns no entities and performs no writes.

---

## Core Business Rules

### Statement Month Computation

Given a purchase date `D` and a credit card with closing day `C`:

- If `D.day ≤ C` → `reference_month` = same month as `D`
- If `D.day > C` → `reference_month` = month of `D` + 1

The due date is derived from `reference_month` + `card.due_day`.

This rule is applied at write time and the resulting `reference_month` is **immutable**. Changing a card's closing or due day takes effect only for future transactions. Dates are evaluated in the user's local timezone (`America/Sao_Paulo` in MVP).

### Installment Distribution

A purchase of total amount `A` split into `N` installments:

- Per-installment amount = `floor(A / N)` cents
- The **last** installment absorbs any rounding remainder: `A − (floor(A / N) × (N − 1))`
- The first installment's `reference_month` follows the standard statement computation from the purchase date
- Each subsequent installment's `reference_month` increments by one calendar month

### Recurring Transaction Generation (Lazy Strategy)

Templates are not pre-generated for all future months at creation time. When a user queries a reference month, the system checks which templates are active for that period and materializes missing transactions. This operation is idempotent: a unique database constraint on `(recurring_transaction_id, reference_month)` prevents duplicates.

A template is active for a given month if:
- `is_active = true`
- `start_month ≤ target_month`
- `end_month IS NULL OR end_month ≥ target_month`

### CLT Income Deduction Calculation

INSS is calculated progressively across salary brackets using the rate table valid for the income year. IRRF is calculated on the INSS-reduced base, further reduced by per-dependent allowances. Both tables are stored in the database keyed by `(type, valid_for_year)`. If no table is found for the requested year, the calculation **fails explicitly** — there is no silent fallback to prior-year rates.

### Preservation of Financial History

All entities use soft deletes — no financial record is ever hard-deleted. Changes to reference data (employment type, card settings, recurring template amounts) do not retroactively alter past materialized transactions. Historical accuracy is preserved by design.

### Money Representation

All monetary values are stored as `BIGINT` in **integer cents** to eliminate floating-point precision errors. `1500` = R$ 15,00. All amounts are always positive; the direction of a money movement is conveyed by the transaction type (`EXPENSE` vs `INCOME`), never by a negative amount.

---

## Modeling Risks

The following risks were identified during domain analysis. Each represents a design decision that, if modeled incorrectly from the start, would require a costly structural migration to correct later.

### Risk 1 — No Explicit `reference_month` Field

Deriving the accounting period at query time from `transaction_date` breaks credit card statement logic and prevents efficient indexing by billing period.

**Decision:** `reference_month` is stored as an immutable `CHAR(7)` column (format `YYYY-MM`), computed server-side at write time and never mutated.

### Risk 2 — Installments as Flat Transaction Rows Without a Plan Entity

Linking N transaction rows with a shared `group_id` fails when cancellation, partial returns, or remaining-debt aggregation is needed. Business logic would embed into every query.

**Decision:** `InstallmentPlan` is a first-class entity. Its N child transactions are materializations, not the primary record.

### Risk 3 — Recurring Template Amount Without Version History

Updating a template's `amount_cents` affects all future projections. Past materialized transactions retain their original amounts at the row level, which is correct. However, if the template's history is ever needed, it is lost.

**Decision:** For MVP, template amounts are updated in place. A `valid_from` / versioned-amount approach is planned for v1.1.

### Risk 4 — Transactions Coupled Directly to Credit Cards

Storing `credit_card_id` on transactions makes adding PIX, debit, or cash payment methods require a schema change to the most-written table in the system.

**Decision:** Transactions reference `payment_method_id`. `CreditCard` is a 1:1 extension of `PaymentMethod`, not the base entity. Other payment types can be added without touching the transactions schema.

### Risk 5 — Money Stored as `DECIMAL` or `FLOAT`

Floating-point precision errors compound silently in aggregation queries and are notoriously hard to debug in financial contexts.

**Decision:** All monetary values are `BIGINT` in integer cents, established from the first migration with no exceptions.

### Risk 6 — Income Modeled as a Transaction Subtype

Treating income as a positive-amount transaction eliminates the structural space needed for the progressive deduction breakdown (INSS, IRRF, VR, VT) and makes historical recalculation per-entry impossible.

**Decision:** `IncomeEntry` is a dedicated entity with its own deduction sub-model. It produces one net income Transaction but is not itself a transaction.

### Risk 7 — Hardcoded Tax Brackets

INSS and IRRF progressive rates change annually by law. Embedding them in application code requires a deploy for each annual update and makes historical recalculation with period-correct rates impossible.

**Decision:** Rate tables are stored in the `deduction_tables` table, keyed by `(type, valid_for_year)`. Updated via database seed migrations, never code changes.

### Risk 8 — Flat Category Model

A flat list prevents hierarchical budgeting and meaningful reporting roll-ups. Retrofitting a parent-child relationship onto a flat table requires a migration that touches every row referencing categories.

**Decision:** `categories.parent_id` is a self-referential foreign key present from the first migration. Maximum depth of 2 is enforced at the application layer.
