# Personal Finance API

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)

A comprehensive RESTful API for personal finance management, designed for the Brazilian financial context. Built with NestJS, PostgreSQL, and Prisma, it provides credit card management, installment tracking, recurring transactions, CLT tax estimation, budgeting, and monthly financial projections — all in a clean, domain-driven architecture.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Database Model Diagram](#database-model-diagram)
- [Core Business Rules](#core-business-rules)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Environment Setup](#environment-setup)
- [Swagger Documentation](#swagger-documentation)
- [Example API Usage Flow](#example-api-usage-flow)
- [Example Workflow (cURL)](#example-workflow-curl)
- [Testing](#testing)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Project Overview

Personal Finance API is a backend service that centralizes monthly financial control into a single ledger and reporting model. It is designed to solve common pain points in personal finance management: fragmented spending records, credit card statement confusion, installment tracking across months, recurring expense visibility, and realistic monthly projections.

The API is tailored for real-world Brazilian workflows, including CLT tax estimation (INSS/IRRF), card closing day rules, and accounting by reference month.

---

## Features

- **User Authentication** — Register and login with JWT-based authentication using Argon2 password hashing.
- **Credit Card Management** — Register credit cards with closing day / due day configuration and automatic statement month computation.
- **One-Time Purchases** — Record credit card purchases that are automatically assigned to the correct statement month.
- **Installment Plans** — Split purchases across multiple months with accurate cent-level distribution (remainder on last installment).
- **Recurring Transactions** — Create expense and income templates that lazily and idempotently generate monthly transactions.
- **Income & CLT Tax Estimation** — Register monthly income with automatic INSS and IRRF deductions for CLT employees using progressive tax brackets.
- **Direct Expenses** — Record non-credit-card expenses (PIX, debit card, cash) as one-time transactions.
- **Transaction Ledger** — Unified, filterable ledger of all financial movements with pagination and multi-criteria queries.
- **Budgeting** — Create monthly budgets with labeled allocations optionally linked to categories.
- **Categories** — System-seeded and user-defined categories for expenses and income, filterable by type.
- **Monthly Summary** — Aggregated view of income, expenses, and balance for any given month.
- **Dashboard & Projections** — Current month summary with forward-looking projections (up to 12 months) based on committed installments and active recurring transactions.
- **Credit Card Statement** — Detailed statement view per card per month with category breakdown.
- **Health Check** — Built-in health endpoint with database connectivity verification.

---

## Architecture

The project follows a **modular domain-driven structure** built on NestJS:

```mermaid
flowchart TB
  Client[Client Apps\nWeb / Mobile / Integrations] --> Controllers[Presentation Layer\nNestJS Controllers + DTO Validation + Swagger]
  Controllers --> Services[Application Layer\nUse Cases + Business Services]
  Services --> Domain[Domain Rules\nTax Calculator + Installment Calculator]
  Services --> Repositories[Infrastructure Layer\nRepositories + Prisma Client]
  Repositories --> DB[(PostgreSQL)]
  Services --> Auth[JWT Auth + Guards]
```

**Key architectural decisions:**

- **Modular bounded contexts** — Each domain (auth, income, installments, etc.) is a self-contained NestJS module with its own controller, service, repository, and DTOs.
- **Single-writer pattern** — Only the owning module writes to its tables. The `transactions` table acts as a unified ledger where entries are created by purchases, installments, recurring, and income modules.
- **Soft deletes** — All entities use `deletedAt` timestamps instead of hard deletes, preserving full financial history.
- **Money in cents** — All monetary values are stored as `BIGINT` integers representing BRL cents (e.g., `150000` = R$ 1,500.00), avoiding floating-point precision issues.
- **Reference month** — Every transaction is tagged with a `YYYY-MM` reference month representing the accounting period, decoupled from the event date.
- **Atomic operations** — Complex writes (e.g., creating an installment plan with N transactions) use Prisma's `$transaction` for consistency.

---

## Database Model Diagram

```mermaid
erDiagram
  users ||--o{ categories : owns
  users ||--o{ payment_methods : owns
  users ||--o{ transactions : owns
  users ||--o{ recurring_transactions : owns
  users ||--o{ installment_plans : owns
  users ||--o{ income_entries : owns
  users ||--o{ monthly_budgets : owns

  payment_methods ||--o| credit_cards : extends
  categories ||--o{ transactions : categorizes
  categories ||--o{ recurring_transactions : categorizes
  categories ||--o{ budget_allocations : categorizes

  payment_methods ||--o{ transactions : pays
  payment_methods ||--o{ recurring_transactions : pays
  payment_methods ||--o{ installment_plans : pays

  installment_plans ||--o{ transactions : generates
  recurring_transactions ||--o{ transactions : generates
  income_entries ||--o{ income_deductions : details
  income_entries ||--|| transactions : creates

  monthly_budgets ||--o{ budget_allocations : allocates
```

This model preserves historical consistency through soft deletes and immutable monthly references while allowing multiple transaction origins (one-time, installment, recurring, and income).

---

## Core Business Rules

### Credit Card Statement Month

The statement month determines which billing cycle a purchase belongs to:

```
If purchase_day ≤ closing_day → statement_month = purchase month
If purchase_day > closing_day → statement_month = purchase month + 1
```

**Example:** Card closes on day 20. A purchase on March 15 goes to the March statement. A purchase on March 22 goes to the April statement.

### Installment Distribution

When splitting a purchase across installments, the system uses integer division with the remainder applied to the last installment:

```
Total: R$ 100.00 (10000 cents) ÷ 3 installments
→ Installment 1: 3333 cents
→ Installment 2: 3333 cents
→ Installment 3: 3334 cents (absorbs remainder)
```

The first installment's reference month is computed from the credit card's closing day, not the purchase date.

### Recurring Transaction Lifecycle

- Recurring transactions are **templates** that lazily generate actual transactions when queried for a given month.
- Generation is **idempotent**: a unique constraint on `(recurringTransactionId, referenceMonth)` silently skips duplicates.
- Templates can be activated/deactivated and have optional start/end months.
- For credit card expenses, the statement month is computed from the template's `dayOfMonth` and the card's closing day.

### CLT Net Income Estimation

For CLT (formal employment) workers, the system automatically calculates:

1. **INSS (Social Security)** — Progressive brackets applied in tiers up to a ceiling.
2. **IRRF (Income Tax)** — Applied to the taxable basis (gross − INSS − dependent allowances) using the matching bracket with base deduction.
3. **Custom deductions** — User-defined deductions (health plan, meal vouchers, etc.) are subtracted after tax calculations.

Tax tables are stored in the database with yearly versioning, allowing updates without code changes.

### Budget Constraints

- One budget per user per month.
- Allocations are labeled line items (e.g., "Food", "Transport") with an allocated amount in cents, optionally linked to a category.
- Allocations are replaced atomically when updated.

### Dashboard Projections

- Projects future months using committed installment transactions and active recurring templates.
- Confidence tiers: **HIGH** (month+1), **MEDIUM** (month+2–3), **LOW** (month+4+).
- Breakdown per projected month: installment expenses, recurring expenses, recurring income.

---

## Tech Stack

| Layer            | Technology                                                    |
| ---------------- | ------------------------------------------------------------- |
| **Runtime**      | Node.js + TypeScript (ES2021, strict mode)                    |
| **Framework**    | NestJS 11                                                     |
| **Database**     | PostgreSQL 16                                                 |
| **ORM**          | Prisma 6                                                      |
| **Auth**         | Passport + JWT + Argon2                                       |
| **Validation**   | class-validator + class-transformer                           |
| **Config**       | @nestjs/config + Joi schema validation                        |
| **API Docs**     | Swagger / OpenAPI (@nestjs/swagger)                           |
| **Health Check** | @nestjs/terminus                                              |
| **Testing**      | Jest (unit + e2e)                                             |
| **Containers**   | Docker Compose (PostgreSQL)                                   |
| **Linting**      | ESLint + Prettier                                             |

---

## Project Structure

```
personal-finance-api/
├── prisma/
│   ├── schema.prisma          # Database schema (13 tables, 6 enums)
│   ├── seed.ts                # Database seeding (tax tables)
│   └── migrations/            # Versioned SQL migrations
├── src/
│   ├── main.ts                # App bootstrap, Swagger, global pipes
│   ├── app.module.ts          # Root module
│   ├── health/                # Health check endpoint
│   ├── modules/
│   │   ├── auth/              # Registration, login, JWT strategy, guards
│   │   ├── users/             # User profile management
│   │   ├── categories/        # System & user-defined categories
│   │   ├── payment-methods/   # Payment instruments + credit card config
│   │   ├── purchases/         # One-time credit card purchases
│   │   ├── installments/      # Installment plans + calculator
│   │   ├── recurring/         # Recurring transaction templates
│   │   ├── income/            # Income entries + CLT tax calculator
│   │   ├── transactions/      # Unified transaction ledger
│   │   ├── budget/            # Monthly budgets + allocations
│   │   └── reporting/         # Summary, dashboard, projections
│   └── shared/
│       ├── config/            # Environment configuration + validation
│       ├── database/          # Prisma service
│       ├── decorators/        # @CurrentUser, @Public
│       ├── exceptions/        # Domain exception filters
│       ├── interceptors/      # Response interceptors
│       └── pagination/        # Pagination DTO + utilities
├── test/                      # E2E test suite
├── docs/                      # Domain documentation
│   ├── api-contract.md        # Full API contract specification
│   ├── data-model.md          # Database design rationale
│   ├── domain-overview.md     # Business domain analysis
│   ├── mvp-scope.md           # MVP phasing strategy
│   └── use-cases.md           # 29 documented use cases
├── docker-compose.yml         # PostgreSQL container
├── TASKS.md                   # Development milestones & progress
└── package.json
```

Each module follows a consistent internal structure:

```
module/
├── module.module.ts           # NestJS module definition
├── module.controller.ts       # HTTP endpoints + Swagger docs
├── module.service.ts          # Business logic
├── module.repository.ts       # Database access (Prisma)
└── dto/                       # Request/response validation
```

---

## API Endpoints

**Base URL:** `/api/v1`

All monetary values are in **BRL cents** (integer). Dates use **YYYY-MM-DD**, reference months use **YYYY-MM**.

### Health

| Method | Route          | Description          | Auth   |
| ------ | -------------- | -------------------- | ------ |
| GET    | `/health`      | Health check status  | Public |

### Auth

| Method | Route            | Description                | Auth   |
| ------ | ---------------- | -------------------------- | ------ |
| POST   | `/auth/register` | Create a new user account  | Public |
| POST   | `/auth/login`    | Authenticate and get JWT   | Public |

<details>
<summary><strong>POST /auth/register</strong></summary>

**Request:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "secret123",
  "employmentType": "CLT"
}
```

**Response (201):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```
</details>

<details>
<summary><strong>POST /auth/login</strong></summary>

**Request:**
```json
{
  "email": "joao@email.com",
  "password": "secret123"
}
```

**Response (200):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```
</details>

### Users

| Method | Route       | Description           | Auth |
| ------ | ----------- | --------------------- | ---- |
| GET    | `/users/me` | Get current user profile | JWT  |
| PATCH  | `/users/me` | Update profile        | JWT  |

<details>
<summary><strong>PATCH /users/me</strong></summary>

**Request:**
```json
{
  "name": "João Santos",
  "employmentType": "PJ"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "João Santos",
    "email": "joao@email.com",
    "employmentType": "PJ"
  }
}
```
</details>

### Categories

| Method | Route             | Description                         | Auth |
| ------ | ----------------- | ----------------------------------- | ---- |
| POST   | `/categories`     | Create a custom category            | JWT  |
| GET    | `/categories`     | List categories (filter by type)    | JWT  |
| PATCH  | `/categories/:id` | Update category name                | JWT  |
| DELETE | `/categories/:id` | Remove a custom category            | JWT  |

<details>
<summary><strong>POST /categories</strong></summary>

**Request:**
```json
{
  "name": "Pets",
  "type": "EXPENSE"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Pets",
    "type": "EXPENSE",
    "isSystem": false
  }
}
```
</details>

### Payment Methods

| Method | Route                            | Description                          | Auth |
| ------ | -------------------------------- | ------------------------------------ | ---- |
| POST   | `/payment-methods`               | Register a payment method            | JWT  |
| GET    | `/payment-methods`               | List payment methods (filter by type)| JWT  |
| GET    | `/payment-methods/:id`           | Get payment method details           | JWT  |
| PATCH  | `/payment-methods/:id`           | Update payment method                | JWT  |
| DELETE | `/payment-methods/:id`           | Soft-delete payment method           | JWT  |
| GET    | `/payment-methods/:id/statement` | Get credit card statement for a month| JWT  |

<details>
<summary><strong>POST /payment-methods</strong> — Register a credit card</summary>

**Request:**
```json
{
  "name": "Nubank Roxinho",
  "type": "CREDIT_CARD",
  "creditCard": {
    "closingDay": 20,
    "dueDay": 27,
    "creditLimitCents": 500000
  }
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Nubank Roxinho",
    "type": "CREDIT_CARD",
    "creditCard": {
      "closingDay": 20,
      "dueDay": 27,
      "creditLimitCents": 500000
    }
  }
}
```
</details>

<details>
<summary><strong>GET /payment-methods/:id/statement?month=2026-03</strong></summary>

**Response (200):**
```json
{
  "data": {
    "referenceMonth": "2026-03",
    "totalCents": 125000,
    "transactions": [
      {
        "id": "uuid",
        "description": "Supermercado Extra",
        "amountCents": 4990,
        "referenceMonth": "2026-03",
        "origin": "ONE_TIME"
      }
    ],
    "categoryBreakdown": [
      { "category": "Food", "totalCents": 4990 }
    ]
  }
}
```
</details>

### Purchases

| Method | Route        | Description                            | Auth |
| ------ | ------------ | -------------------------------------- | ---- |
| POST   | `/purchases` | Create a one-time credit card purchase | JWT  |

<details>
<summary><strong>POST /purchases</strong></summary>

**Request:**
```json
{
  "paymentMethodId": "uuid",
  "categoryId": "uuid",
  "description": "Supermercado Extra",
  "amountCents": 4990,
  "purchaseDate": "2026-03-15",
  "notes": "Weekly groceries"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "description": "Supermercado Extra",
    "amountCents": 4990,
    "referenceMonth": "2026-03",
    "origin": "ONE_TIME"
  }
}
```
</details>

### Installment Plans

| Method | Route                  | Description                         | Auth |
| ------ | ---------------------- | ----------------------------------- | ---- |
| POST   | `/installment-plans`   | Create an installment purchase      | JWT  |
| GET    | `/installment-plans`   | List all installment plans          | JWT  |
| GET    | `/installment-plans/:id` | Get plan details with installments| JWT  |
| DELETE | `/installment-plans/:id` | Cancel future installments        | JWT  |

<details>
<summary><strong>POST /installment-plans</strong></summary>

**Request:**
```json
{
  "paymentMethodId": "uuid",
  "categoryId": "uuid",
  "description": "MacBook Pro 16\"",
  "totalAmountCents": 2500000,
  "installmentCount": 12,
  "purchaseDate": "2026-03-05",
  "notes": "New work laptop"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "description": "MacBook Pro 16\"",
    "totalAmountCents": 2500000,
    "installmentCount": 12,
    "status": "ACTIVE",
    "installments": [
      {
        "referenceMonth": "2026-03",
        "amountCents": 208333,
        "installmentNumber": 1
      },
      {
        "referenceMonth": "2026-04",
        "amountCents": 208333,
        "installmentNumber": 2
      }
    ]
  }
}
```
</details>

### Recurring Transactions

| Method | Route                                      | Description                   | Auth |
| ------ | ------------------------------------------ | ----------------------------- | ---- |
| POST   | `/recurring-transactions`                  | Create a recurring template   | JWT  |
| GET    | `/recurring-transactions`                  | List templates (filter type/active) | JWT |
| GET    | `/recurring-transactions/:id`              | Get template details          | JWT  |
| PATCH  | `/recurring-transactions/:id`              | Update template               | JWT  |
| PATCH  | `/recurring-transactions/:id/activate`     | Reactivate a template         | JWT  |
| PATCH  | `/recurring-transactions/:id/deactivate`   | Pause a template              | JWT  |
| DELETE | `/recurring-transactions/:id`              | Soft-delete a template        | JWT  |

<details>
<summary><strong>POST /recurring-transactions</strong></summary>

**Request:**
```json
{
  "description": "Netflix",
  "amountCents": 4990,
  "type": "EXPENSE",
  "startMonth": "2026-03",
  "endMonth": "2026-12",
  "dayOfMonth": 10,
  "paymentMethodId": "uuid",
  "categoryId": "uuid",
  "notes": "Monthly streaming subscription"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "description": "Netflix",
    "amountCents": 4990,
    "type": "EXPENSE",
    "startMonth": "2026-03",
    "endMonth": "2026-12",
    "isActive": true
  }
}
```
</details>

### Income

| Method | Route              | Description                          | Auth   |
| ------ | ------------------ | ------------------------------------ | ------ |
| GET    | `/income/estimate` | Estimate CLT net income (public)     | Public |
| POST   | `/income`          | Register monthly income              | JWT    |
| GET    | `/income`          | List all income entries              | JWT    |
| GET    | `/income/:id`      | Get income entry with deductions     | JWT    |
| PATCH  | `/income/:id`      | Update income entry                  | JWT    |
| DELETE | `/income/:id`      | Soft-delete income entry             | JWT    |

<details>
<summary><strong>GET /income/estimate?grossCents=700000&dependents=0</strong> — Public CLT tax calculator</summary>

**Response (200):**
```json
{
  "data": {
    "grossCents": 700000,
    "inssCents": 55147,
    "irrfCents": 37962,
    "netCents": 606891,
    "dependents": 0,
    "year": 2026,
    "inssSlices": [
      { "from": 0, "to": 141865, "rateBps": 750, "deductedCents": 10640 },
      { "from": 141866, "to": 265912, "rateBps": 900, "deductedCents": 11164 }
    ]
  }
}
```
</details>

<details>
<summary><strong>POST /income</strong></summary>

**Request:**
```json
{
  "referenceMonth": "2026-03",
  "grossCents": 700000,
  "description": "Salário",
  "dependents": 0,
  "customDeductions": [
    { "description": "Plano de saúde", "amountCents": 50000 },
    { "description": "Vale transporte", "amountCents": 20000 }
  ]
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "referenceMonth": "2026-03",
    "grossCents": 700000,
    "netCents": 536891,
    "deductions": [
      { "description": "INSS", "amountCents": 55147, "isAutoCalculated": true },
      { "description": "IRRF", "amountCents": 37962, "isAutoCalculated": true },
      { "description": "Plano de saúde", "amountCents": 50000, "isAutoCalculated": false },
      { "description": "Vale transporte", "amountCents": 20000, "isAutoCalculated": false }
    ]
  }
}
```
</details>

### Transactions

| Method | Route               | Description                             | Auth |
| ------ | ------------------- | --------------------------------------- | ---- |
| POST   | `/transactions`     | Create a direct expense (non-credit-card) | JWT |
| GET    | `/transactions`     | List transactions with filters + pagination | JWT |
| GET    | `/transactions/:id` | Get transaction details                 | JWT  |
| PATCH  | `/transactions/:id` | Update a one-time transaction           | JWT  |
| DELETE | `/transactions/:id` | Soft-delete a one-time transaction      | JWT  |

**Query parameters for GET `/transactions`:**

| Parameter          | Type   | Description                                |
| ------------------ | ------ | ------------------------------------------ |
| `page`             | number | Page number (default: 1)                   |
| `limit`            | number | Items per page (default: 20, max: 100)     |
| `type`             | enum   | `EXPENSE` or `INCOME`                      |
| `origin`           | enum   | `ONE_TIME`, `INSTALLMENT`, `RECURRING`, `INCOME` |
| `reference_month`  | string | Filter by month (`YYYY-MM`)               |
| `payment_method_id`| UUID   | Filter by payment method                   |
| `category_id`      | UUID   | Filter by category                         |

<details>
<summary><strong>POST /transactions</strong> — Direct expense</summary>

**Request:**
```json
{
  "description": "Groceries",
  "amountCents": 5000,
  "transactionDate": "2026-03-07",
  "paymentMethodId": "uuid",
  "categoryId": "uuid",
  "notes": "Weekly shopping"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "description": "Groceries",
    "amountCents": 5000,
    "type": "EXPENSE",
    "origin": "ONE_TIME",
    "referenceMonth": "2026-03"
  }
}
```

> **Note:** Credit card payment methods are not allowed for direct expenses. Use the `/purchases` endpoint instead.
</details>

### Budgets

| Method | Route             | Description                    | Auth |
| ------ | ----------------- | ------------------------------ | ---- |
| POST   | `/budgets`        | Create a monthly budget        | JWT  |
| GET    | `/budgets`        | List all budgets               | JWT  |
| GET    | `/budgets/:month` | Get budget for a specific month| JWT  |
| PATCH  | `/budgets/:month` | Update budget and allocations  | JWT  |
| DELETE | `/budgets/:month` | Remove a budget                | JWT  |

<details>
<summary><strong>POST /budgets</strong></summary>

**Request:**
```json
{
  "referenceMonth": "2026-03",
  "totalBudgetCents": 500000,
  "allocations": [
    { "label": "Food", "allocatedCents": 150000, "categoryId": "uuid" },
    { "label": "Transport", "allocatedCents": 80000 },
    { "label": "Entertainment", "allocatedCents": 50000 }
  ]
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "referenceMonth": "2026-03",
    "totalBudgetCents": 500000,
    "allocations": [
      { "label": "Food", "allocatedCents": 150000 },
      { "label": "Transport", "allocatedCents": 80000 },
      { "label": "Entertainment", "allocatedCents": 50000 }
    ]
  }
}
```
</details>

### Reporting

| Method | Route             | Description                                 | Auth |
| ------ | ----------------- | ------------------------------------------- | ---- |
| GET    | `/summary/:month` | Monthly financial summary                   | JWT  |
| GET    | `/dashboard`      | Dashboard with projections                  | JWT  |

<details>
<summary><strong>GET /summary/2026-03</strong></summary>

**Response (200):**
```json
{
  "data": {
    "referenceMonth": "2026-03",
    "totalIncomeCents": 700000,
    "totalExpenseCents": 325000,
    "balanceCents": 375000,
    "transactionCount": 15
  }
}
```
</details>

<details>
<summary><strong>GET /dashboard?month=2026-03&projectionMonths=3</strong></summary>

**Response (200):**
```json
{
  "data": {
    "currentMonth": {
      "referenceMonth": "2026-03",
      "totalIncomeCents": 700000,
      "totalExpenseCents": 325000,
      "balanceCents": 375000
    },
    "projections": [
      {
        "referenceMonth": "2026-04",
        "confidence": "HIGH",
        "projectedIncomeCents": 700000,
        "projectedExpenseCents": 285000,
        "breakdown": {
          "installmentCents": 208333,
          "recurringExpenseCents": 76667,
          "recurringIncomeCents": 700000
        }
      },
      {
        "referenceMonth": "2026-05",
        "confidence": "MEDIUM",
        "projectedIncomeCents": 700000,
        "projectedExpenseCents": 285000
      }
    ]
  }
}
```
</details>

---

## Authentication

The API uses **JWT Bearer Token** authentication:

1. **Register** a new account via `POST /api/v1/auth/register`.
2. **Login** with credentials via `POST /api/v1/auth/login`.
3. Both endpoints return a **JWT token** (default expiry: 7 days).
4. Include the token in subsequent requests:
   ```
   Authorization: Bearer <token>
   ```
5. Passwords are hashed with **Argon2** (winner of the Password Hashing Competition).
6. On registration, the system automatically **seeds default categories** for the user.

**Public endpoints** (no token required):
- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/income/estimate`

All other endpoints require a valid JWT token.

---

## Environment Setup

### Prerequisites

- **Node.js** 18+
- **Docker** and **Docker Compose**
- **npm**

### 1. Clone the repository

```bash
git clone https://github.com/your-username/personal-finance-api.git
cd personal-finance-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://finance_user:finance_pass@localhost:5432/personal_finance?schema=public"
JWT_SECRET="your-secret-key-here"
JWT_EXPIRATION="7d"
PORT=3000
```

### 4. Start the database

```bash
# Start PostgreSQL via Docker Compose
npm run db:up
```

This starts a PostgreSQL 16 container with the credentials defined in `docker-compose.yml`.

### 5. Run migrations

```bash
npm run db:migrate
```

### 6. Seed the database

```bash
npm run db:seed
```

This populates the tax bracket tables (INSS/IRRF) needed for CLT income calculations.

### 7. Start the server

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api/v1`.

### Available npm scripts

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run start:dev`  | Start in development mode (watch)     |
| `npm run start`      | Start in standard mode                |
| `npm run start:prod` | Start compiled production build       |
| `npm run build`      | Compile TypeScript                    |
| `npm run db:up`      | Start PostgreSQL container            |
| `npm run db:down`    | Stop PostgreSQL container             |
| `npm run db:migrate` | Run Prisma migrations                 |
| `npm run db:seed`    | Seed the database                     |
| `npm run db:studio`  | Open Prisma Studio (database GUI)     |
| `npm run db:reset`   | Reset database (drop + migrate + seed)|
| `npm run lint`       | Run ESLint                            |
| `npm run format`     | Run Prettier                          |
| `npm run test`       | Run unit tests                        |
| `npm run test:e2e`   | Run end-to-end tests                  |
| `npm run test:cov`   | Run tests with coverage report        |

---

## Swagger Documentation

Interactive API documentation is available via Swagger UI when the server is running:

```
http://localhost:3000/api/docs
```

The Swagger UI provides:
- Complete endpoint documentation with request/response schemas
- JWT authentication support (click **Authorize** and paste your token)
- Try-it-out functionality for testing endpoints directly
- Auto-generated schemas from DTOs with validation rules

---

## Example API Usage Flow

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant API as Personal Finance API
  participant DB as PostgreSQL

  User->>API: POST /auth/register
  API->>DB: Create user + seed categories
  DB-->>API: user created
  API-->>User: JWT token

  User->>API: POST /payment-methods (credit card)
  API->>DB: Save payment method + credit card config
  API-->>User: paymentMethodId

  User->>API: POST /purchases
  API->>API: Compute statement/reference month
  API->>DB: Create transaction (ONE_TIME)
  API-->>User: purchase recorded

  User->>API: POST /installment-plans
  API->>API: Split amount across N months
  API->>DB: Create plan + installment transactions
  API-->>User: plan + installments

  User->>API: GET /dashboard?month=YYYY-MM
  API->>DB: Aggregate summary + projections
  API-->>User: monthly insights
```

---

## Example Workflow (cURL)

A realistic end-to-end usage of the API:

### 1. Create a user account

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "secret123",
    "employmentType": "CLT"
  }'
```

### 2. Login and get JWT token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "password": "secret123"
  }'
# Save the returned token
TOKEN="eyJhbGciOi..."
```

### 3. Register a credit card

```bash
curl -X POST http://localhost:3000/api/v1/payment-methods \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Nubank Roxinho",
    "type": "CREDIT_CARD",
    "creditCard": {
      "closingDay": 20,
      "dueDay": 27,
      "creditLimitCents": 500000
    }
  }'
# Save the returned payment method ID
CARD_ID="uuid-from-response"
```

### 4. Make a one-time purchase

```bash
curl -X POST http://localhost:3000/api/v1/purchases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "paymentMethodId": "'$CARD_ID'",
    "description": "Supermercado Extra",
    "amountCents": 15000,
    "purchaseDate": "2026-03-15"
  }'
```

### 5. Create an installment purchase

```bash
curl -X POST http://localhost:3000/api/v1/installment-plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "paymentMethodId": "'$CARD_ID'",
    "description": "MacBook Pro",
    "totalAmountCents": 2500000,
    "installmentCount": 12,
    "purchaseDate": "2026-03-05"
  }'
```

### 6. Register monthly income

```bash
curl -X POST http://localhost:3000/api/v1/income \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "referenceMonth": "2026-03",
    "grossCents": 700000,
    "description": "Salário",
    "dependents": 0,
    "customDeductions": [
      { "description": "Plano de saúde", "amountCents": 50000 }
    ]
  }'
```

### 7. Set up a recurring expense

```bash
curl -X POST http://localhost:3000/api/v1/recurring-transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "description": "Netflix",
    "amountCents": 4990,
    "type": "EXPENSE",
    "startMonth": "2026-03",
    "dayOfMonth": 10,
    "paymentMethodId": "'$CARD_ID'"
  }'
```

### 8. View the monthly summary

```bash
curl http://localhost:3000/api/v1/summary/2026-03 \
  -H "Authorization: Bearer $TOKEN"
```

### 9. Check the dashboard with projections

```bash
curl "http://localhost:3000/api/v1/dashboard?month=2026-03&projectionMonths=3" \
  -H "Authorization: Bearer $TOKEN"
```

### 10. View the credit card statement

```bash
curl "http://localhost:3000/api/v1/payment-methods/$CARD_ID/statement?month=2026-03" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Testing

The project uses **Jest** for both unit and end-to-end testing.

### Test structure

```
src/
├── modules/
│   ├── income/
│   │   ├── income.service.spec.ts
│   │   └── tax-calculator.service.spec.ts
│   ├── installments/
│   │   ├── installment-calculator.spec.ts
│   │   └── installments.service.spec.ts
│   ├── payment-methods/
│   │   ├── credit-card-statement.service.spec.ts
│   │   └── payment-methods.service.spec.ts
│   ├── purchases/
│   │   └── purchases.service.spec.ts
│   └── recurring/
│       └── recurring.service.spec.ts
test/
└── app.e2e-spec.ts
```

### Running tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

### What's tested

- **Tax Calculator** — Progressive INSS/IRRF bracket calculations with edge cases
- **Installment Calculator** — Cent-level distribution and remainder handling
- **Credit Card Statement** — Statement month computation across closing day boundaries
- **Purchases** — Validation rules, date constraints, payment method type checks
- **Installments** — Full lifecycle: creation, transaction generation, cancellation
- **Recurring** — Template creation, idempotent generation, activation/deactivation
- **Income** — CLT auto-deduction, custom deductions, net income validation
- **Payment Methods** — CRUD operations, deletion constraints with active plans

---

## Future Improvements

- **Bank Integration** — Connect with Open Banking APIs for automatic transaction import
- **OFX/CSV Import** — Import bank statements and credit card invoices from file exports
- **Mobile Application** — React Native or Flutter companion app
- **Advanced Forecasting** — ML-based spending predictions and anomaly detection
- **Goals & Savings** — Financial goal tracking with progress visualization
- **Brazilian Specifics** — 13º salary, vacation pay (férias), FGTS tracking
- **Spending Trends** — Historical analysis with charts and comparisons
- **Shared Finances** — Multi-user household budget management
- **Materialized Views** — Precomputed aggregations for improved dashboard performance
- **Audit Log** — Complete audit trail of all financial data changes
- **Multi-Currency** — Support for international transactions with exchange rates
- **PJ Income Support** — Tax estimation for independent contractors (MEI/Simples/Lucro Presumido)
- **Notifications** — Bill reminders, budget alerts, and spending notifications

---

## License

This project is [MIT licensed](LICENSE).
