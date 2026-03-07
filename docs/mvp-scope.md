# MVP Scope

## Phase Philosophy

The scope is divided into three phases driven by two principles:

1. **Correctness before completeness.** The MVP must get the foundational data modeling right — reference months, statement logic, installment distribution — before adding features on top of it. A feature built on a broken foundation propagates the structural error into every report and projection.

2. **Prove the core, then expand the surface.** The MVP goal is a working, trustworthy system that manages credit card expenses with installment and recurring support, calculates net income from gross salary, and presents a meaningful monthly summary. Everything else waits.

---

## MVP — Phase 0 and 1 (Current Target)

The MVP delivers a complete credit-card-centric monthly finance manager with income tracking and consolidated reporting.

### Authentication & User Management
- User registration with name, email, hashed password, and employment type
- JWT-based authentication
- Profile view and update (name, employment type)
- System category seeding on registration

### Payment Methods — Credit Cards
- Register multiple credit cards with closing day, due day, and credit limit
- List and view payment methods
- Full statement month computation engine: given a purchase date and card configuration, compute the correct `reference_month` and `due_date`

### Categories
- List all categories (system-defined)
- System-defined categories seeded on user creation: Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Assinaturas, Salário, and others

### Credit Card Purchases
- Register one-time purchases with server-computed statement month and due date
- Register installment purchases: system generates N transaction records, one per future statement month, with correct rounding on the last installment
- View installment plan details including the full generated schedule
- List all installment plans with remaining installments and remaining total
- Cancel an installment plan: soft-deletes all future (unpaid) installments while preserving past ones

### Recurring Transactions
- Create monthly recurring templates for subscriptions, fixed expenses, or recurring income
- Lazy, idempotent generation: transactions are materialized for a month only when that month is queried
- Activate and deactivate templates without losing history
- Edit template description, amount, end date, and active status (forward-only)
- Delete template without touching previously generated transactions

### Income
- Stateless CLT net income estimator: given gross salary, year, and dependent count, returns full INSS and IRRF breakdown (no auth required)
- Register income entries per reference month
  - CLT: INSS and IRRF auto-calculated and persisted from year-keyed database tables
  - Custom deductions (VR, VT, health plan, etc.) appended on top
- Edit income entry: auto-deductions recomputed on gross change; net income transaction updated
- View income entries by month
- Employment type snapshotted at entry creation for historical accuracy

### Transactions
- Unified transaction ledger query: filter by reference month, date range, type, category, payment method, installment, or recurring origin
- View individual transaction details including installment and recurring context

### Reporting
- **Monthly Summary**: for a given YYYY-MM period, returns gross income, total deductions, net income, total expenses broken down by category and by payment method, installment burden, recurring burden, one-time expenses, and resulting balance
- **Dashboard**: current month summary combined with a 3-month forward projection based on open installments and active recurring templates, with a confidence indicator per projected month
- **Credit Card Statement**: all transactions for a given card and reference month, with due date and total

### What MVP Deliberately Excludes

The following exist in the schema from day one but have no active API endpoints in MVP:

| Feature | Schema status | API status |
|---|---|---|
| User-defined categories | `parent_id` column exists | No create/edit endpoints |
| Monthly budgets | `monthly_budgets` table exists | No endpoints exposed |
| Per-category budget allocations | `budget_allocations` table exists | No endpoints exposed |
| Investment plans | `investment_plans` table exists | No endpoints exposed |
| Direct expenses (non-card cash/PIX) | Supported by the transactions table | Endpoint deferred to Phase 5 |
| Transaction edit and delete | Data model supports it | Endpoints deferred to Phase 5 |
| PJ income deduction configuration | Employment type stored | Deduction logic deferred |

The schema is designed so none of these require destructive migrations to activate.

---

## v1.1 — Expanding the Surface

Built on a proven, stable MVP core.

### Payment Methods
- PIX, cash, debit, and boleto as active payment method types
- Direct expense registration through any non-card payment method

### Categories
- User-defined categories with up to 2 levels of nesting
- Rename, delete (with reassignment policy for historical transactions)

### Budgets
- Monthly spending cap definition
- Per-category budget allocations
- Budget vs. actual comparison in monthly summary
- Budget alerts when allocation percentage thresholds are crossed

### Investment Plans
- Monthly investment targets as a percentage of net income or a fixed amount
- Standing default plan with optional per-month overrides
- Investment target reflected in monthly summary's "available for spending" calculation and projections

### Income
- PJ income with configurable deductions (DAS, accountant fee, optional INSS)
- Multiple income sources per month (freelance, secondary employment)
- Recurring income templates (salary registered as a recurring transaction)

### Recurring Transactions
- Amount version history with `effective_from` dates (past materializations remain accurate)

### Transactions
- Full edit and delete endpoints
- `REFUND` transaction type to handle returns cleanly

### Reporting
- Budget comparison available in monthly summary response
- Investment target reflected in dashboard projections
- Projection confidence logic extended to 6 months

---

## Future Phases

Improvements requiring significant new design or integration work.

### Financial Goals
- Named savings goals with custom target amounts and target dates (emergency fund, travel, house down payment)
- Monthly contribution tracking per goal
- Projected achievement date based on current contribution pace
- Emergency fund target expressed as a multiple of average monthly expenses

### Income — Brazilian-Specific
- 13th salary (13º salário) as a separate income event with correct IRRF calculation
- Vacation pay (férias) = salary + 1/3 extra income
- FGTS accumulation tracking (informational, not a cash flow item)

### Historical Analysis
- Annual summary: yearly income, taxes paid, expenses by category, savings rate
- Year-over-year comparison for income, spending, and balance
- Category spending trends over rolling 12-month windows

### Performance — Read Model Materialization
- Closed month summaries cached as materialized rows
- Triggered when a month transitions to a closed state
- Background job architecture for refreshing projections

### Audit and Compliance
- Full audit log with before/after diffs for all entity mutations
- Month open/close lifecycle with explicit state transitions
- Locked months prevent edits on past finalized data

### Shared Finances
- Household or couple accounts with shared financial visibility
- Per-member expense attribution
- Shared budget management

### Integrations
- CSV import for bank statements and card exports
- PDF statement generation
- Open Banking connectivity (future regulatory landscape dependent)

### Multi-Currency
- Monetary values already carry a `currency` field in MVP
- Exchange rate integration for foreign purchases
- Currency-normalized reporting

---

## Decision Rationale: MVP Boundary

The features excluded from MVP fall into one of three categories:

**1. Deferred because they don't change the core model (safe to defer):**
User-defined categories, investment plans, monthly budgets. The schema accepts them from day one. The API just doesn't expose the endpoints yet.

**2. Deferred because they require new complexity on top of a stable base:**
PIX/cash payments, PJ income logic, goal tracking. These require the core to be stable and proven before adding the next layer of logic.

**3. Out of scope for the product's current focus:**
Multi-currency conversion, Open Banking sync, household accounts. These are product decisions, not technical limitations.
