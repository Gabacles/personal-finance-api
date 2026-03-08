# Implementation Roadmap

## Strategy

Tasks are organized as **vertical slices**: each milestone delivers working, testable API endpoints from the database to the HTTP layer. No milestone ends with "the repository layer is done but services aren't wired yet."

Each milestone's tasks are ordered by dependency. A task marked `[ ]` is pending; `[x]` is complete.

---

## Milestone 0 — Foundation
> Goal: A running NestJS server with Prisma connected to PostgreSQL, global error handling, Swagger, and a health check. No domain logic yet.

- [x] M0-01: Initialize NestJS project (CLI scaffold, clean boilerplate)
- [x] M0-02: Configure TypeScript (strict mode, path aliases)
- [x] M0-03: Set up ESLint + Prettier with portfolio-quality rules
- [x] M0-04: Create Docker Compose for PostgreSQL
- [x] M0-05: Install and configure Prisma (datasource, shadow DB for migrations)
- [x] M0-06: Create `.env` and `.env.example` with all required variables
- [x] M0-07: Implement `PrismaService` in `shared/database`
- [x] M0-08: Set up `ConfigModule` with env validation (Joi)
- [x] M0-09: Configure global `ValidationPipe` with strict settings
- [x] M0-10: Implement `ResponseEnvelopeInterceptor` (wraps all responses in `{ data }`)
- [x] M0-11: Implement domain exception classes (`BusinessRuleException`, `EntityNotFoundException`, `UnauthorizedResourceException`)
- [x] M0-12: Implement `GlobalExceptionFilter` mapping domain exceptions to HTTP
- [x] M0-13: Set up Swagger (`@nestjs/swagger`) with JWT bearer auth
- [x] M0-14: Implement `GET /health` endpoint
- [x] M0-15: Write initial Prisma schema (all 13 tables from data model)
- [x] M0-16: Run first migration, seed `deduction_tables` with 2026 INSS/IRRF brackets

**Completed:** March 7, 2026

---

## Milestone 1 — Auth & Users
> Goal: Working register/login endpoints with JWT; authenticated user profile; system categories seeded on registration.

**Dependencies:** M0 complete

- [x] M1-01: Create `users` Prisma model queries in `UsersRepository`
- [x] M1-02: Implement `UsersService` (`findByEmail`, `findById`, `create`)
- [x] M1-03: Set up `PassportModule` + `JwtModule` in `AuthModule`
- [x] M1-04: Implement `JwtStrategy` (validate JWT payload, attach user to request)
- [x] M1-05: Implement `JwtAuthGuard` (global, with `@Public()` decorator bypass)
- [x] M1-06: Implement `AuthService.register` (hash password with argon2, create user, seed categories, return token)
- [x] M1-07: Implement `AuthService.login` (verify credentials, return token)
- [x] M1-08: Implement `POST /api/v1/auth/register` and `POST /api/v1/auth/login`
- [x] M1-09: Implement `CurrentUser` decorator (extracts user from JWT request)
- [x] M1-10: Implement `GET /api/v1/users/me`
- [x] M1-11: Implement `PATCH /api/v1/users/me` with employment type change warning
- [x] M1-12: Create `CategoriesService.seedSystemCategories(userId)` — called after registration
- [ ] M1-13: Unit tests for `AuthService` (register, login, duplicate email, wrong password)
- [ ] M1-14: Unit tests for system category seeding

**Completed (core):** March 7, 2026

**Notes:**
- Use `argon2` (not bcrypt) for password hashing — stronger defaults
- JWT payload: `{ sub: userId, email }` — minimal, no sensitive data
- `@Public()` decorator marks routes that bypass `JwtAuthGuard`
- Category seeding is synchronous during registration; if it fails, registration rolls back

---

## Milestone 2 — Payment Methods & Credit Cards
> Goal: CRUD for credit cards; `CreditCardStatementService` computing reference_month and due_date; card statement view.

**Dependencies:** M1 complete

- [x] M2-01: Implement `PaymentMethodsRepository` (`create`, `findAllByUser`, `findById`)
- [x] M2-02: Implement `CreditCardRepository` (`createForPaymentMethod`, `findByPaymentMethodId`)
- [x] M2-03: Implement `CreditCardStatementService.compute(closingDay, purchaseDate)` — pure function, no DB
- [x] M2-04: Unit tests for `CreditCardStatementService` — 11/11 passing (all boundary cases)
- [x] M2-05: Implement `PaymentMethodsService` (`create`, `findAll`, `findById`)
- [x] M2-06: Implement `POST /api/v1/payment-methods` (creates PaymentMethod + CreditCard atomically via $transaction)
- [x] M2-07: Implement `GET /api/v1/payment-methods` and `GET /api/v1/payment-methods/:id`
- [x] M2-08: Ownership enforced via `findById(id, userId)` DB filter — no separate guard needed
- [x] M2-09: Unit tests for `PaymentMethodsService` — 5/5 passing

**Note:** Fixed global `BigInt.prototype.toJSON` in `main.ts` — Prisma returns BigInt for BIGINT columns; Express can't serialize these natively.

**Completed:** March 7, 2026

**Notes:**
- `CreditCardStatementService` is a pure computation service — no `@Injectable` DB deps, only config
- `ResourceOwnerGuard` is applied at the controller decorator level; not inside services
- The `POST /payment-methods` handler creates both `payment_method` and `credit_card` rows inside a Prisma `$transaction`

---

## Milestone 3 — Categories
> Goal: Categories endpoint available; system categories queryable with optional type filter.

**Dependencies:** M1 complete (seeding is already wired in M1)

- [x] M3-01: Implement `CategoriesRepository` (`findAllForUser`, `findById`)
- [x] M3-02: Implement `CategoriesService` (`findAll`, `validateOwnershipAndType`, `seedSystemCategories`)
- [x] M3-03: Implement `GET /api/v1/categories` with `type` query param
- [x] M3-04: Export `CategoriesService` — exported from `CategoriesModule`

**Completed:** March 7, 2026 (implemented as part of M1)

**Notes:**
- `validateOwnershipAndType(categoryId, userId, expectedType)` is the shared guard used by all write endpoints before assigning a category — throw `EntityNotFoundException` or `BusinessRuleException` as appropriate

---

## Milestone 4 — Transactions Core
> Goal: Unified transaction ledger with read/filter endpoints; `TransactionsService` ready to receive writes from other modules.

**Dependencies:** M2, M3 complete

- [x] M4-01: Implement `TransactionsRepository`:
  - `create(data, tx?)` — single transaction insert (optional tx client for cross-module use)
  - `createMany(data[], tx)` — bulk insert within caller's `$transaction`
  - `findByFilters(userId, filters, pagination)` — paginated with all supported filters
  - `findById(id, userId)` — with enriched relations (category, paymentMethod+creditCard, installmentPlan)
  - `softDelete(id)`
  - `findByRecurringAndMonth(recurringId, month)` — idempotency check
  - `findFutureInstallments(planId, currentMonth)` — for cancellation and projection
- [x] M4-02: Implement `TransactionsService`:
  - `createExpense(data, tx?)` — called by Purchases module
  - `createInstallmentBatch(data[], tx)` — called by Installments module
  - `createFromRecurring(input)` — catches P2002 for idempotency, returns null if already generated
  - `createIncomeTransaction(data, tx?)` — called by Income module
  - `findByFilters(userId, filters, pagination)`
  - `findById(id, userId)` — throws EntityNotFoundException
- [x] M4-03: Implement `GET /api/v1/transactions` with all filters from API contract
- [x] M4-04: Implement `GET /api/v1/transactions/:id`
- [x] M4-05: Export `TransactionsService` for use by Purchases, Installments, Recurring, Income
- [x] M4-06: Unit tests for `TransactionsService` — 8/8 passing (createExpense, installmentBatch, recurring idempotency, P2002 handling, findByFilters, findById)

**Completed:** March 7, 2026

**Notes:**
- `TransactionsService` is intentionally "dumb" about business rules — it receives ready-to-write data from orchestrating modules
- `createMany` is called from within the caller's `$transaction` block (passed in), not from its own transaction
- Soft-delete filter (`deleted_at: null`) must appear on every query method without exception

---

## Milestone 5 — Purchases (One-Time Credit Card)
> Goal: `POST /api/v1/purchases` working end-to-end with correct reference_month computation.

**Dependencies:** M2, M3, M4 complete

- [x] M5-01: Implement `PurchasesService.create`:
  1. Validate payment method belongs to user and is `CREDIT_CARD`
  2. Validate category belongs to user (or is system) and has type `EXPENSE`
  3. Validate `purchase_date` is not in the future
  4. Call `CreditCardStatementService.compute` → get `reference_month`
  5. Call `TransactionsService.createExpense` with computed fields
  6. Return enriched transaction response
- [x] M5-02: Implement `POST /api/v1/purchases`
- [x] M5-03: Unit tests for `PurchasesService` — 6/6 passing:
  - payment method not found → 404
  - wrong payment method type → 422 PAYMENT_METHOD_NOT_CREDIT_CARD
  - future purchase date → 422 FUTURE_PURCHASE_DATE
  - category type mismatch → 422 CATEGORY_TYPE_MISMATCH
  - correct reference_month (same month) returned in response
  - next-month rollover when purchaseDay > closingDay

**Note:** `PurchasesService` has no repository — it orchestrates `PaymentMethodsRepository`, `CategoriesService`, `TransactionsService`.

**Completed:** March 7, 2026

---

## Milestone 6 — Installment Plans
> Goal: Full installment lifecycle — create (with N-row generation), view, list (with remaining totals), cancel.

**Dependencies:** M2, M3, M4 complete

- [x] M6-01: Implement `installment-calculator.ts` pure functions:
  - `calculateInstallmentAmounts(totalCents, count): number[]`
  - `computeInstallmentReferenceMonths(firstMonth, count): string[]`
- [x] M6-02: Unit tests for `installment-calculator.ts`:
  - even division
  - remainder on last installment (single cent, multi-cent)
  - month increment overflow (December → January of next year)
- [x] M6-03: Implement `InstallmentsRepository`:
  - `create(plan)` — insert plan row
  - `findAllByUser(userId, filters)` — with derived remaining counts
  - `findById(id, userId)` — with all installment transactions
  - `findActiveByPaymentMethod(paymentMethodId)` — for deactivation guard
  - `cancel(planId)` — update status to CANCELLED
- [x] M6-04: Implement `InstallmentsService.create`:
  1. Validate payment method and category (same rules as M5)
  2. Validate `installment_count >= 2`
  3. Call `CreditCardStatementService.compute` → `firstReferenceMonth`
  4. Call `calculateInstallmentAmounts`, `computeInstallmentReferenceMonths`
  5. Open Prisma `$transaction`: create `InstallmentPlan` row + call `TransactionsService.createInstallmentBatch`
  6. Return plan with full installment schedule
- [x] M6-05: Implement `InstallmentsService.cancel`:
  1. Verify plan belongs to user, is `ACTIVE`
  2. Find all non-deleted installments where `reference_month > currentMonth`
  3. Soft-delete them in bulk
  4. Update plan status to `CANCELLED`
  5. Return count of cancelled and preserved installments
- [x] M6-06: Implement `InstallmentsService.findAll` with derived fields (`remaining_installments`, `remaining_amount_cents`, `next_installment_month`)
- [x] M6-07: Implement `POST /api/v1/installment-plans`
- [x] M6-08: Implement `GET /api/v1/installment-plans` and `GET /api/v1/installment-plans/:id`
- [x] M6-09: Implement `DELETE /api/v1/installment-plans/:id`
- [x] M6-10: Unit tests for `InstallmentsService` covering all business rules

**Completed:** March 7, 2026

**Notes:**
- `installment-calculator.ts` — pure functions, no framework deps (10 unit tests)
- `InstallmentsService` unit tests — 9/9 passing (51 total across 6 suites)
- Cancellation uses `reference_month > currentMonth` (strictly greater, current month preserved)
- `Prisma.TransactionClient` — correct type for `$transaction` callback (not `Omit<PrismaService, ...>`)

---

## Milestone 7 — Recurring Transactions
> Goal: Recurring template CRUD; lazy idempotent generation working and internally callable.

**Dependencies:** M2, M3, M4 complete

- [x] M7-01: Implement `RecurringRepository`:
  - `create(data)`
  - `findAllByUser(userId, filters)`
  - `findById(id, userId)`
  - `findActiveForMonth(userId, month)` — filters by `is_active`, `start_month`, `end_month`
  - `update(id, data)` — template properties only
  - `softDelete(id)`
- [x] M7-02: Implement `RecurringService.create` with validations:
  - `INCOME` type → `payment_method_id` must be null
  - `EXPENSE` + `CREDIT_CARD` → `day_of_month` used for statement month computation
  - Category type must match transaction type
- [x] M7-03: Implement `RecurringService.generateForMonth(userId, month)`:
  1. Query all active templates for the month
  2. For each: attempt `TransactionsService.createFromRecurring`
  3. Catch Prisma unique constraint error (`P2002` on `recurring_transaction_id` + `reference_month`) → skip silently (already generated)
  4. Return list of newly created transaction IDs
- [x] M7-04: Implement `RecurringService.update` — forward-only amount changes, immutable `start_month`
- [x] M7-05: Implement template CRUD endpoints (POST, GET list, GET one, PATCH, DELETE)
- [x] M7-06: Implement `PATCH /api/v1/recurring-transactions/:id/activate` and `/deactivate`
- [x] M7-07: Export `RecurringService` for use by Reporting modules
- [x] M7-08: Unit tests for `RecurringService.generateForMonth` (idempotency, active filter logic)

**Completed:** March 7, 2026

**Notes:**
- 16 unit tests (67 total across 7 suites), TypeScript clean, smoke tested all endpoints
- `generateForMonth` is an internal method; it is not exposed as an HTTP endpoint
- The idempotency guard is the database unique constraint — the service catches `P2002`, not a pre-check-then-insert pattern
- `dayOfMonthToDateInMonth` clamps to last day of month to handle months with fewer days than dayOfMonth

---

## Milestone 8 — Income
> Goal: `TaxCalculatorService` with 2026 INSS/IRRF logic; income registration with auto-deductions; net income transaction created.

**Dependencies:** M4 complete (TransactionsService needed)

- [x] M8-01: Implement `TaxCalculatorService.computeCLT(grossCents, year, dependents)`:
  - Load `DeductionTable` rows for INSS and IRRF for the given year
  - Calculate INSS progressively across brackets
  - Calculate IRRF on (gross − INSS − dependent allowances)
  - Return full breakdown with bracket detail
  - Throw `EntityNotFoundException` if no table exists for the year
- [x] M8-02: Unit tests for `TaxCalculatorService` with 2026 bracket values:
  - salary below all INSS thresholds
  - salary spanning multiple INSS brackets
  - salary above IRRF exemption threshold
  - salary above all IRRF brackets
  - with and without dependents
- [x] M8-03: Implement `GET /api/v1/income/estimate` — stateless, `@Public()`, calls `TaxCalculatorService`
- [x] M8-04: Implement `IncomeRepository` (`create`, `findByMonth`, `findById`, `updateGross`)
- [x] M8-05: Implement `IncomeDeductionRepository` (`createMany`, `deleteByEntry`, `findByEntry`)
- [x] M8-06: Implement `IncomeService.register`:
  1. Snapshot `employment_type` from user
  2. If CLT: call `TaxCalculatorService.computeCLT` → persist auto deductions
  3. Persist custom deductions
  4. Assert net > 0
  5. Call `TransactionsService.createIncomeTransaction` with net amount
  6. Return full entry with deduction breakdown
- [x] M8-07: Implement `IncomeService.update` — full recalculation on gross change
- [x] M8-08: Implement `POST /api/v1/income`, `GET /api/v1/income`, `GET /api/v1/income/:id`, `PATCH /api/v1/income/:id`
- [x] M8-09: Unit tests for `IncomeService` (CLT auto-deductions, PJ no auto-deductions, net ≤ 0 rejection)

**Completed:** March 7, 2026

**Notes:**
- 86 total tests (9 suites), TypeScript clean, smoke tested all endpoints
- Pure computation exported from `tax-calculator.service.ts` as `calcInss` / `calcIrrf` helpers — tested without DI
- INSS: progressive per bracket slice; capped when `rateBps: null` final bracket
- IRRF: simplified tabela progressiva (`taxable * rate - deduction`); dependent allowance = 18,959 per dependent (2026)
- On update: if `customDeductions` provided → delete all + recreate everything; otherwise only auto deductions are replaced

---

## Milestone 9 — Reporting
> Goal: Monthly summary and dashboard working end-to-end; credit card statement view; installment overview.

**Dependencies:** M5, M6, M7, M8 complete (all write modules done)

- [x] M9-01: Implement `SummaryService.getForMonth(userId, month)`:
  1. Call `RecurringService.generateForMonth(userId, month)` (side-effect trigger)
  2. Query all transactions for the month (expenses + income)
  3. Query income entries and their deduction totals
  4. Aggregate: by category, by payment method, by origin type (one-time / installment / recurring)
  5. Compose and return `MonthlySummaryDto`
- [x] M9-02: Implement `GET /api/v1/summary/:month`
- [x] M9-03: Implement `DashboardService.get(userId, month, projectionMonths)`:
  1. Call `SummaryService.getForMonth` for current month
  2. For each future month: query open installments + active recurring templates → compute projected balance
  3. Assign confidence level (`HIGH` for +1 month, `MEDIUM` for +2/+3)
  4. Compose and return `DashboardResponseDto`
- [x] M9-04: Implement `GET /api/v1/dashboard`
- [x] M9-05: Implement `GET /api/v1/payment-methods/:id/statement`
- [x] M9-06: Implement `GET /api/v1/installment-plans` (overview with remaining totals — likely already done in M6-08, verify enrichment is correct)
- [x] M9-07: Integration tests for `SummaryService` covering:
  - month with no income returns zero income fields
  - installment charges correctly bucketed as `installment_cents`
  - recurring-generated transactions correctly bucketed as `recurring_cents`
  - balance = net_income − total_expenses

---

## Milestone 10 — Polish (Phase 5 endpoints)
> Goal: Remaining write endpoints (direct expenses, transaction edit/delete, card update/deactivate).

**Dependencies:** M9 complete

- [ ] M10-01: Implement `POST /api/v1/transactions` (direct expense — non-card)
- [ ] M10-02: Implement `PATCH /api/v1/transactions/:id`
- [ ] M10-03: Implement `DELETE /api/v1/transactions/:id`
- [ ] M10-04: Implement `PATCH /api/v1/payment-methods/:id`
- [ ] M10-05: Implement `DELETE /api/v1/payment-methods/:id` with installment plan guard
- [ ] M10-06: Implement `DELETE /api/v1/income/:id`
- [ ] M10-07: Implement `PATCH /api/v1/users/me`
- [ ] M10-08: E2E test suite covering the critical happy paths across all milestones

---

## Milestone 11 — v1.1 (Future)
> Schema-ready features that require new business logic but no structural migrations.

- [ ] User-defined categories (POST/PATCH/DELETE /categories)
- [ ] Monthly budgets and allocations
- [ ] Investment plans
- [ ] PIX/Cash/Debit as active payment method types
- [ ] PJ income deduction configuration
- [ ] Recurring amount version history

---

## Implementation Notes

### Dependency Injection Order
When wiring modules, follow this import order to avoid circular dependencies:
```
shared/* ← never imports from modules/
categories ← shared
users ← shared
auth ← users
payment-methods ← users
transactions ← payment-methods, categories
purchases ← transactions, payment-methods, categories
installments ← transactions, payment-methods, categories
recurring ← transactions, payment-methods, categories
income ← transactions
reporting/summary ← recurring, transactions, income
reporting/dashboard ← summary, recurring, installments
```

### Soft Delete Discipline
Every `findMany` / `findFirst` on a soft-deletable table **must** include `deleted_at: null`. Any repository method missing this filter is a bug that produces incorrect financial data.

### reference_month Immutability
`reference_month` is computed once at write time and never accepted as API input. Any DTO that exposes `reference_month` as a writable field must be fixed immediately.

### Prisma $transaction Usage
Atomic operations requiring multiple writes (installment plan creation, income registration with deductions) must use Prisma's `$transaction` to guarantee consistency. These are called from **services**, not repositories.

### Error Code Discipline
Domain exceptions use string error codes (`'INSTALLMENT_COUNT_BELOW_MINIMUM'`, `'TAX_TABLE_NOT_FOUND'`) that appear in response bodies. This makes the API machine-readable for client error handling.
