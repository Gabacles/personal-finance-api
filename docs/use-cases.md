# Use Cases

Use cases are grouped by module and ordered by implementation priority within each phase. Each use case maps directly to one or more API endpoints.

**Flow legend:**
- **W** — Write: creates or mutates persistent state
- **R** — Read: queries and returns data without side effects
- **W+R** — Write with a read side-effect (e.g., lazy generation triggered before aggregation)

---

## Module 1: Identity & User Management

### UC-01 — Register User
**Phase:** 0 — Foundation  
**Flow:** W

**Goal:** Create a new user account, hash credentials, seed system categories, and return a JWT.

**Input:** `name`, `email`, `password`, `employment_type`

**Output:** User record and `access_token`

**Validations:**
- Email must be unique among active (non-deleted) users
- Password minimum length: 8 characters
- `employment_type` must be a valid enum value (`CLT`, `PJ`, `OTHER`)

**Failures:** Duplicate email → `409` · Weak password → `422` · Invalid enum → `422`

**Dependencies:** Categories module (system category seeding on registration)

---

### UC-02 — Authenticate User
**Phase:** 0 — Foundation  
**Flow:** W

**Goal:** Validate credentials and issue a JWT for subsequent authenticated requests.

**Input:** `email`, `password`

**Output:** `access_token`, expiry

**Validations:**
- User must exist and not be soft-deleted
- Password must match stored hash

**Failures:** User not found → `404` · Invalid credentials → `401`

**Dependencies:** None

---

### UC-03 — View and Update User Profile
**Phase:** 5 — Polish  
**Flow:** R / W

**Goal:** Return the authenticated user's profile; optionally update name or employment type.

**Input (update):** `name?`, `employment_type?`

**Output:** User record; warning if `employment_type` changes (past income records are unaffected)

**Validations:** At least one field must be provided for update; `employment_type` must be a valid enum value

**Failures:** No updatable fields provided → `400` · Invalid enum → `422`

---

## Module 2: Payment Methods & Credit Cards

### UC-04 — Register Credit Card
**Phase:** 1 — Credit Card Core  
**Flow:** W

**Goal:** Create a payment method of type `CREDIT_CARD` with billing cycle configuration.

**Input:** `label`, `closing_day`, `due_day`, `limit_cents`, `currency?`

**Output:** `PaymentMethod` and `CreditCard` records

**Validations:**
- `closing_day` and `due_day`: integers between 1 and 28 (avoids month-length ambiguity)
- `limit_cents` > 0
- `label` must not be empty

**Failures:** Out-of-range day values → `422` · Negative limit → `422`

**Dependencies:** User must be authenticated

---

### UC-05 — List Payment Methods
**Phase:** 1 — Credit Card Core  
**Flow:** R

**Goal:** Return all active payment methods for the authenticated user, including credit card configuration where applicable.

**Input:** Optional filters: `type`, `is_active`

**Output:** List of payment methods with optional `credit_card` sub-object

**Dependencies:** None

---

### UC-06 — Compute Statement Month
**Phase:** 1 — Credit Card Core (internal)  
**Flow:** R

**Goal:** Given a purchase date and a credit card, return the correct `reference_month` and `due_date`. This is a pure computation function — it has no side effects.

**Input:** `credit_card_id`, `purchase_date`

**Output:** `reference_month` (`YYYY-MM`), `due_date` (date), `statement_closing_date` (date)

**Business rule:**
- `purchase_date.day ≤ closing_day` → `reference_month` = purchase month
- `purchase_date.day > closing_day` → `reference_month` = purchase month + 1
- `due_date` = `reference_month` + `due_day`

**Note:** This use case is invoked internally by UC-07, UC-08, and UC-12. It is not a public endpoint — it is a service method.

**Dependencies:** CreditCard configuration

---

### UC-07 — Update Credit Card Settings
**Phase:** 5 — Polish  
**Flow:** W

**Goal:** Update closing day, due day, limit, or label on an existing credit card.

**Input:** `payment_method_id`, `closing_day?`, `due_day?`, `limit_cents?`, `label?`

**Output:** Updated payment method; warning if cycle settings changed (existing transactions are unaffected)

**Business rule:** Changes to `closing_day` or `due_day` are not retroactive. Existing transactions retain their materialized `reference_month`.

**Failures:** Card not found or not owned → `404 / 403` · Out-of-range day values → `422`

---

### UC-08 — Deactivate Payment Method
**Phase:** 5 — Polish  
**Flow:** W

**Goal:** Soft-delete a payment method, preventing future use without affecting historical data.

**Input:** `payment_method_id`

**Output:** Confirmation with `deactivated_at` timestamp

**Validations:**
- Cannot deactivate if open future installment plans exist on this card
- Active recurring transactions linked to this card generate a warning

**Failures:** Active installment plans exist → `409`

---

## Module 3: Categories

### UC-09 — List Categories
**Phase:** 0 — Foundation  
**Flow:** R

**Goal:** Return all categories available to the authenticated user — both system-defined and user-defined.

**Input:** Optional filters: `type` (`EXPENSE`, `INCOME`, `INVESTMENT`), `include_system`

**Output:** Flat or tree-structured category list

**Note:** User-defined category creation is deferred to v1.1. System categories are seeded on user registration and available immediately.

---

## Module 4: Transactions & Purchases

### UC-10 — Add a One-Time Credit Card Purchase
**Phase:** 1 — Credit Card Core  
**Flow:** W

**Goal:** Register a single purchase on a credit card. Server computes `reference_month` and `due_date` from the card's billing cycle — the client never supplies them.

**Input:** `payment_method_id`, `description`, `amount_cents`, `purchase_date`, `category_id`, `notes?`

**Output:** Transaction record with computed `reference_month`, `due_date`, and `payment_method` details

**Validations:**
- `amount_cents` > 0
- `payment_method_id` must be type `CREDIT_CARD` and belong to the user
- `category_id` must exist and have type `EXPENSE`
- `purchase_date` must not be in the future

**Failures:** Wrong payment method type → `422` · Future purchase date → `400` · Category not found → `404`

**Dependencies:** UC-06 (statement month computation), Categories, Payment Methods

---

### UC-11 — Add an Installment Purchase
**Phase:** 1 — Credit Card Core  
**Flow:** W

**Goal:** Register a credit card purchase split across N future statement months. Creates one `InstallmentPlan` and N `Transaction` records atomically.

**Input:** `payment_method_id`, `description`, `total_amount_cents`, `installment_count`, `purchase_date`, `category_id`, `notes?`

**Output:** `InstallmentPlan` record with the full generated installment schedule (all N transactions with their `reference_month` and `due_date`)

**Validations:**
- `installment_count` ≥ 2
- `total_amount_cents` > 0
- Same payment method and category validations as UC-10
- `first_reference_month` computed via UC-06; subsequent months increment by 1 calendar month
- Last installment absorbs rounding remainder

**Failures:** `installment_count < 2` → `422` · Same failures as UC-10

**Dependencies:** UC-06, Categories, Payment Methods, Transactions module (atomic write)

---

### UC-12 — Cancel an Installment Plan
**Phase:** 1 — Credit Card Core  
**Flow:** W

**Goal:** Cancel a purchase mid-way. Soft-deletes all **future** installment transactions while preserving past ones for historical accuracy.

**Input:** `installment_plan_id`

**Output:** Plan marked `CANCELLED`; count of cancelled and preserved installments returned

**Business rule:** "Future" = `reference_month > current month`. Past installments remain intact — they represent money already charged and are part of the financial record.

**Validations:**
- Plan must belong to the authenticated user
- Plans already `CANCELLED` or `COMPLETED` cannot be cancelled again

**Failures:** Plan not found or not owned → `404 / 403` · Already cancelled → `409`

---

### UC-13 — Add a Direct Expense (Non-Card)
**Phase:** 5 — Polish  
**Flow:** W

**Goal:** Register a one-time expense not associated with a credit card (cash, PIX, boleto, etc.).

**Input:** `description`, `amount_cents`, `transaction_date`, `category_id`, `payment_method_id?`, `notes?`

**Output:** Transaction record. `reference_month` defaults to the month of `transaction_date`.

**Validations:**
- `category_id` must have type `EXPENSE`
- If `payment_method_id` is provided, it must not be of type `CREDIT_CARD` (credit card purchases use UC-10)
- `amount_cents` > 0

**Dependencies:** Categories

---

### UC-14 — Edit a Transaction
**Phase:** 5 — Polish  
**Flow:** W

**Goal:** Update description, amount, category, or notes on a manually created transaction.

**Input:** `transaction_id`, `description?`, `amount_cents?`, `category_id?`, `notes?`

**Business rules:**
- `reference_month` is immutable — rejection is immediate if attempted
- If the transaction was generated by a recurring template, only this instance is edited; the template is untouched
- If the transaction is an installment, the edit applies to this installment only; the plan's `total_amount_cents` is not updated

**Failures:** Attempt to mutate `reference_month` → `422` · Not found or not owned → `404 / 403`

---

### UC-15 — Delete a Transaction
**Phase:** 5 — Polish  
**Flow:** W

**Goal:** Soft-delete a transaction. For installment transactions, only this occurrence is deleted. For recurring-generated transactions, only this month's occurrence is suppressed.

**Input:** `transaction_id`

**Output:** Confirmation with contextual note explaining the scope of deletion

**Note:** Deleting an installment transaction does not cancel the plan. Use UC-12 for full plan cancellation.

---

### UC-16 — List Transactions
**Phase:** 1 — Credit Card Core  
**Flow:** R

**Goal:** Return the user's transactions with flexible filtering and pagination.

**Input:** `reference_month?`, `date_from?`, `date_to?`, `type?`, `category_id?`, `payment_method_id?`, `is_installment?`, `is_recurring?`, `sort_by?`, `sort_order?`, `page`, `limit`

**Output:** Paginated transaction list with enriched fields (category name, card label, installment context)

**Note:** `reference_month` takes precedence over `date_from`/`date_to` when both are provided.

---

## Module 5: Recurring Transactions

### UC-17 — Create a Recurring Transaction Template
**Phase:** 3 — Recurring  
**Flow:** W

**Goal:** Define a template for a monthly repeating transaction — subscription, fixed expense, or recurring income.

**Input:** `type`, `description`, `amount_cents`, `category_id`, `payment_method_id?`, `start_month`, `end_month?`, `day_of_month?`

**Output:** `RecurringTransaction` template record

**Validations:**
- `type = INCOME` → `payment_method_id` must be null
- `type = EXPENSE` and `payment_method_id` points to a credit card → statement month computed from `day_of_month`
- `start_month ≤ end_month` if `end_month` is set
- `category_id` type must match transaction type

**Failures:** Income type with payment method → `422` · Category type mismatch → `422` · Invalid month order → `422`

**Dependencies:** UC-06 (for credit card recurring expenses), Categories, Payment Methods

---

### UC-18 — Generate Recurring Transactions for a Month (Internal)
**Phase:** 3 — Recurring (internal)  
**Flow:** W

**Goal:** Ensure all active recurring templates have a corresponding transaction for the target reference month. Called internally before any monthly read — not a public endpoint.

**Input (internal):** `user_id`, `reference_month`

**Business rules:**
- Template is active for the month if `is_active = true AND start_month ≤ month AND (end_month IS NULL OR end_month ≥ month)`
- Idempotent: the unique constraint `(recurring_transaction_id, reference_month)` on non-deleted transactions prevents duplicates
- Existing overridden transactions are left untouched

---

### UC-19 — Edit a Recurring Transaction Template
**Phase:** 3 — Recurring  
**Flow:** W

**Goal:** Update template metadata or amount for future occurrences.

**Input:** `recurring_transaction_id`, `description?`, `amount_cents?`, `category_id?`, `end_month?`, `is_active?`

**Business rules:**
- `start_month` is immutable
- `amount_cents` change is forward-only; already-materialized transactions retain their original amounts
- Setting `is_active = false` pauses the template without deleting it

**Output:** Updated template with warning if amount changed

---

### UC-20 — Activate / Deactivate a Recurring Transaction
**Phase:** 3 — Recurring  
**Flow:** W

**Goal:** Toggle a template's active state. Deactivation pauses generation; activation resumes it from the current month forward.

**Input:** `recurring_transaction_id`

**Output:** Template with updated `is_active` status

---

### UC-21 — Delete a Recurring Transaction Template
**Phase:** 3 — Recurring  
**Flow:** W

**Goal:** Soft-delete a template. All previously generated transactions are preserved.

**Input:** `recurring_transaction_id`

**Output:** Confirmation; note that past transactions are unaffected

---

## Module 6: Income

### UC-22 — Estimate CLT Net Income
**Phase:** 0 — Foundation  
**Flow:** R

**Goal:** Stateless computation of net income after INSS and IRRF deductions. No authentication required — useful as a public calculator.

**Input:** `gross_amount_cents`, `year`, `dependents?`

**Output:** Full deduction breakdown including progressive bracket detail for INSS and IRRF, and final net amount

**Business rules:**
- INSS is calculated progressively across salary brackets from the year's table
- IRRF base = gross − INSS − (dependents × per-dependent allowance)
- IRRF is calculated progressively on the base
- If no `DeductionTable` record exists for the given year, fail explicitly — no fallback

**Failures:** Table not found for year → `404` · `gross_amount_cents ≤ 0` → `422`

**Dependencies:** `deduction_tables` data

---

### UC-23 — Register Income Entry
**Phase:** 2 — Income  
**Flow:** W

**Goal:** Record an income event for a reference month with automatic deduction calculation and net income transaction creation.

**Input:** `reference_month`, `description`, `gross_amount_cents`, `dependents?`, `custom_deductions?: [{name, amount_cents}]`

**Output:** `IncomeEntry` with deduction breakdown, `total_deductions_cents`, `net_amount_cents`, and the ID of the generated net income transaction

**Business rules:**
- If user's `employment_type = CLT`: INSS and IRRF are auto-calculated via UC-22 and persisted as `IncomeDeduction` records (`is_auto_calculated = true`)
- Custom deductions appended as `is_auto_calculated = false`
- Employment type snapshotted from user profile at creation time
- Net amount after all deductions must be > 0
- A `Transaction` of type `INCOME` is created with `amount_cents = net_amount`

**Failures:** Net amount ≤ 0 after deductions → `422` · Tax table missing for year → `404`

**Dependencies:** UC-22, Transactions module

---

### UC-24 — Edit Income Entry
**Phase:** 2 — Income  
**Flow:** W

**Goal:** Update gross amount or custom deductions. Auto-deductions are fully recomputed on any gross change.

**Input:** `income_entry_id`, `gross_amount_cents?`, `custom_deductions?`

**Business rules:**
- Auto-deductions deleted and recomputed from scratch on gross amount change
- Custom deductions replaced in full (not merged)
- Linked transaction `amount_cents` updated to new net
- `reference_month` is immutable

**Failures:** New net ≤ 0 → `422`

---

### UC-25 — List Income Entries
**Phase:** 2 — Income  
**Flow:** R

**Goal:** Return income entries for a given period with deduction breakdown and net amounts.

**Input:** `reference_month?`, `date_from?`, `date_to?`, `page`, `limit`

**Output:** Paginated list of income entries with full deduction context

---

## Module 7: Reporting

### UC-26 — Get Monthly Summary
**Phase:** 4 — Reporting  
**Flow:** W+R

**Goal:** Return the complete financial picture for a given reference month: income, expenses by category and payment method, installment and recurring breakdown, and resulting balance.

**Input:** `reference_month` (YYYY-MM)

**Internal side effect:** UC-18 (recurring generation) is called first for the requested month before aggregation. The client is unaware of this.

**Output:**
- Income: gross, deductions total, net
- Expenses: total, broken down by category (with percentage), by payment method, and by origin type (one-time, installment, recurring)
- Balance: net income − total expenses
- Budget comparison: present if a `MonthlyBudget` exists for the month (null in MVP)

**Dependencies:** UC-18, Transactions, Income, Budgets (optional)

---

### UC-27 — Get Dashboard Overview
**Phase:** 4 — Reporting  
**Flow:** W+R

**Goal:** Return the current month's summary alongside a 3-month forward projection. The primary entry point for a consumer's home screen.

**Input:** `month?` (defaults to current month), `projection_months?` (default 3, max 6)

**Output:**
- Current month: full summary per UC-26
- Projection per future month:
  - Projected income (from active recurring income templates)
  - Open installments (already-generated installment transactions)
  - Recurring charges (active expense templates)
  - Projected balance
  - Confidence indicator: `HIGH` (next month) or `MEDIUM` (2–3 months)
- Metadata: generation timestamp and projection basis explanation

**Note:** Projection uses only deterministic data. Non-recurring, one-time future expenses are not included.

**Dependencies:** UC-26, UC-18, Recurring, Installments

---

### UC-28 — Get Credit Card Statement
**Phase:** 4 — Reporting  
**Flow:** R

**Goal:** Return all transactions assigned to a specific card for a given statement month, plus the card-limit snapshot already committed from that month onward.

**Input:** `payment_method_id`, `reference_month`

**Output:** Card data, statement total, `committed_limit_cents`, `available_limit_cents`, and itemized transaction list with installment context

**Dependencies:** Transactions, CreditCard

---

### UC-29 — Get Installment Plans Overview
**Phase:** 4 — Reporting  
**Flow:** R

**Goal:** Return all installment plans with computed remaining installments and outstanding balance.

**Input:** `status?`, `payment_method_id?`, `page`, `limit`

**Output:** Paginated list with `remaining_installments`, `remaining_amount_cents`, and `next_installment_month` derived at query time

**Dependencies:** Transactions (count non-deleted future installments)

---

## Implementation Order

| Order | Use Case | Phase | Rationale |
|---|---|---|---|
| 1 | UC-01 Register User | 0 | Entry point for everything |
| 2 | UC-02 Authenticate User | 0 | Auth gate for all subsequent requests |
| 3 | UC-09 List Categories | 0 | Every transaction needs a category |
| 4 | UC-22 Estimate CLT Net Income | 0 | Pure function; establishes tax logic early; independently testable |
| 5 | UC-04 Register Credit Card | 1 | Unlocks all purchase use cases |
| 6 | UC-05 List Payment Methods | 1 | Required for card selection |
| 7 | UC-06 Compute Statement Month | 1 | Internal function; correctness gate for all card purchases |
| 8 | UC-10 Add One-Time Purchase | 1 | First real transaction write |
| 9 | UC-11 Add Installment Purchase | 1 | Highest-value feature; core differentiator |
| 10 | UC-12 Cancel Installment Plan | 1 | Natural lifecycle companion to create |
| 11 | UC-16 List Transactions | 1 | First real read; validates the write flow |
| 12 | UC-23 Register Income Entry | 2 | Completes the income side; needed for monthly summary |
| 13 | UC-24 Edit Income Entry | 2 | Correction flow expected immediately |
| 14 | UC-25 List Income Entries | 2 | Read companion |
| 15 | UC-17 Create Recurring Template | 3 | Unlocks subscriptions and recurring salary |
| 16 | UC-18 Generate for Month (internal) | 3 | Must exist before UC-26 is callable |
| 17 | UC-19 Edit Recurring Template | 3 | Expected immediately after create |
| 18 | UC-20 Activate/Deactivate | 3 | Lifecycle completeness |
| 19 | UC-21 Delete Recurring Template | 3 | Lifecycle completeness |
| 20 | UC-26 Monthly Summary | 4 | Proves end-to-end domain model correctness |
| 21 | UC-28 Credit Card Statement | 4 | High-value card-specific view |
| 22 | UC-29 Installment Plans Overview | 4 | Shows remaining debt at a glance |
| 23 | UC-27 Dashboard Overview | 4 | Portfolio showpiece; requires all prior use cases |
| 24 | UC-13 Direct Expense | 5 | Real-world completeness |
| 25 | UC-14 Edit Transaction | 5 | Correction flow |
| 26 | UC-15 Delete Transaction | 5 | Correction flow |
| 27 | UC-07 Update Card Settings | 5 | Maintenance |
| 28 | UC-08 Deactivate Payment Method | 5 | Lifecycle management |
| 29 | UC-03 Update User Profile | 5 | Rarely changed; low priority |
