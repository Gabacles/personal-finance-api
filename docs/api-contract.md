# API Contract

## Global Conventions

### Base URL and Versioning

All endpoints are prefixed with `/api/v1`. Versioning is embedded in the URL path rather than a request header, making it visible in logs, browser tools, and client code.

When a v2 is introduced, `/api/v2` runs alongside `/api/v1` during a deprecation window. No header negotiation is required from clients.

### Authentication

All endpoints except `/api/v1/auth/*` and `GET /api/v1/income/estimate` require a valid JWT:

```
Authorization: Bearer <access_token>
```

- Missing or expired token → `401 Unauthorized`
- Valid token, but resource belongs to another user → `403 Forbidden`

### Money Values

All monetary amounts are transmitted and stored as **integer cents** (`number`, representing `BIGINT` in the database). The API consumer is responsible for display formatting.

- `150000` = R$ 1.500,00
- `5490` = R$ 54,90

### Date and Period Formats

| Concept | Format | Example |
|---|---|---|
| Timestamp | ISO 8601 UTC | `2026-03-07T14:30:00Z` |
| Date only | ISO 8601 | `2026-03-07` |
| Reference month | `YYYY-MM` | `2026-03` |

Reference months are never transmitted as full dates. The period `2026-03` means the entirety of March 2026, not the 1st of March.

### Response Envelope

**Single resource:**
```json
{
  "data": { }
}
```

**Collection (paginated):**
```json
{
  "data": [ ],
  "meta": {
    "total": 84,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

**With non-blocking warnings:**
```json
{
  "data": { },
  "warnings": [
    "Employment type changed. Past income records are not affected."
  ]
}
```

### Error Format

```json
{
  "statusCode": 422,
  "error": "UnprocessableEntity",
  "message": "Validation failed",
  "details": [
    { "field": "closing_day", "message": "Must be between 1 and 28" }
  ]
}
```

### Pagination

All paginated endpoints accept:

| Param | Default | Max | Description |
|---|---|---|---|
| `page` | `1` | — | 1-based page number |
| `limit` | `20` | `100` | Items per page |

### Soft Deletes

`DELETE` endpoints always perform soft deletes. Hard deletion is never allowed through the API. Soft-deleted records are excluded from all responses automatically.

---

## Auth

### `POST /api/v1/auth/register`

Creates a new user account, seeds system categories, and returns a JWT.

**Request body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "minhasenha123",
  "employment_type": "CLT"
}
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | Required, non-empty |
| `email` | string | Required, valid email format, unique |
| `password` | string | Required, minimum 8 characters |
| `employment_type` | string | Required, one of `CLT`, `PJ`, `OTHER` |

**Response `201`:**
```json
{
  "data": {
    "access_token": "eyJhbGci...",
    "expires_in": 86400,
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com",
      "employment_type": "CLT",
      "created_at": "2026-03-07T14:00:00Z"
    }
  }
}
```

**Status codes:** `201` Created · `409` Email already registered · `422` Validation failed

---

### `POST /api/v1/auth/login`

Validates credentials and issues a JWT.

**Request body:**
```json
{
  "email": "joao@email.com",
  "password": "minhasenha123"
}
```

**Response `200`:**
```json
{
  "data": {
    "access_token": "eyJhbGci...",
    "expires_in": 86400
  }
}
```

**Status codes:** `200` · `401` Invalid credentials · `404` User not found

---

## Users

### `GET /api/v1/users/me`

Returns the authenticated user's profile.

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com",
    "employment_type": "CLT",
    "created_at": "2026-03-07T14:00:00Z",
    "updated_at": "2026-03-07T14:00:00Z"
  }
}
```

---

### `PATCH /api/v1/users/me`

Updates name or employment type. All fields optional.

**Request body:**
```json
{
  "name": "João M. Silva",
  "employment_type": "PJ"
}
```

**Response `200`:** Same shape as `GET /users/me`, plus optional `warnings` array if `employment_type` changed.

**Status codes:** `200` · `400` No fields provided · `422` Validation failed

---

## Payment Methods & Credit Cards

### `POST /api/v1/payment-methods`

Creates a payment method. In MVP, only `type: "CREDIT_CARD"` is accepted.

**Request body:**
```json
{
  "type": "CREDIT_CARD",
  "label": "Nubank Gold",
  "credit_card": {
    "closing_day": 5,
    "due_day": 12,
    "limit_cents": 500000,
    "currency": "BRL"
  }
}
```

| Field | Type | Rules |
|---|---|---|
| `type` | string | Required, `CREDIT_CARD` (MVP) |
| `label` | string | Required, max 100 chars |
| `credit_card.closing_day` | number | Required, integer 1–28 |
| `credit_card.due_day` | number | Required, integer 1–28 |
| `credit_card.limit_cents` | number | Required, integer > 0 |
| `credit_card.currency` | string | Optional, 3 chars, default `BRL` |

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "type": "CREDIT_CARD",
    "label": "Nubank Gold",
    "is_active": true,
    "credit_card": {
      "id": "uuid",
      "closing_day": 5,
      "due_day": 12,
      "limit_cents": 500000,
      "currency": "BRL"
    },
    "created_at": "2026-03-07T14:00:00Z"
  }
}
```

**Status codes:** `201` · `422` Validation failed

---

### `GET /api/v1/payment-methods`

Lists all payment methods for the authenticated user.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `type` | string | Filter by `CREDIT_CARD`, etc. |
| `is_active` | boolean | Default: `true` |

**Response `200`:** Array of payment methods (not paginated — users typically have few cards).

---

### `GET /api/v1/payment-methods/:id`

Returns a single payment method with credit card details.

**Status codes:** `200` · `404` Not found · `403` Not owned by user

---

### `PATCH /api/v1/payment-methods/:id` *(Phase 5)*

Updates label or credit card cycle configuration.

**Request body (all optional):**
```json
{
  "label": "Nubank Ultravioleta",
  "credit_card": {
    "closing_day": 10,
    "due_day": 17,
    "limit_cents": 1000000
  }
}
```

**Response `200`:** Updated payment method, with a warning in `warnings[]` if `closing_day` or `due_day` changed.

---

### `DELETE /api/v1/payment-methods/:id` *(Phase 5)*

Soft-deactivates a payment method.

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "is_active": false,
    "deactivated_at": "2026-03-07T14:00:00Z"
  }
}
```

**Status codes:** `200` · `409` Active installment plans exist on this card

---

### `GET /api/v1/payment-methods/:id/statement`

Returns all transactions for a specific card and reference month, with due date and total.

**Query params:**

| Param | Required | Description |
|---|---|---|
| `month` | Yes | `YYYY-MM` |

**Response `200`:**
```json
{
  "data": {
    "payment_method_id": "uuid",
    "label": "Nubank Gold",
    "reference_month": "2026-03",
    "due_date": "2026-03-12",
    "total_cents": 84500,
    "currency": "BRL",
    "transactions": [
      {
        "id": "uuid",
        "description": "Supermercado Extra",
        "amount_cents": 25000,
        "transaction_date": "2026-02-28",
        "category": { "id": "uuid", "name": "Alimentação" },
        "installment_info": null,
        "is_recurring": false
      },
      {
        "id": "uuid",
        "description": "iPhone 15 Pro",
        "amount_cents": 50000,
        "transaction_date": "2026-02-20",
        "category": { "id": "uuid", "name": "Eletrônicos" },
        "installment_info": {
          "plan_id": "uuid",
          "installment_number": 2,
          "total_installments": 12,
          "total_amount_cents": 600000
        },
        "is_recurring": false
      }
    ]
  }
}
```

**Status codes:** `200` · `400` Invalid month format · `404` Card not found

---

## Categories

### `GET /api/v1/categories`

Returns available categories (system-defined in MVP).

**Query params:**

| Param | Type | Description |
|---|---|---|
| `type` | string | `EXPENSE`, `INCOME`, or `INVESTMENT` |
| `include_system` | boolean | Default: `true` |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Alimentação",
      "type": "EXPENSE",
      "parent_id": null,
      "is_system": true,
      "icon": "utensils"
    }
  ]
}
```

Not paginated — the category list is small and finite.

---

## Purchases (One-Time Credit Card)

### `POST /api/v1/purchases`

Registers a single credit card purchase. The server computes `reference_month` and `due_date` from the card's billing configuration — the client must never supply these.

**Request body:**
```json
{
  "payment_method_id": "uuid",
  "description": "Supermercado Extra",
  "amount_cents": 25000,
  "purchase_date": "2026-02-28",
  "category_id": "uuid",
  "notes": "Compra semanal"
}
```

| Field | Type | Rules |
|---|---|---|
| `payment_method_id` | string | Required, must be `CREDIT_CARD` type, owned by user |
| `description` | string | Required, max 255 chars |
| `amount_cents` | number | Required, integer > 0 |
| `purchase_date` | string | Required, ISO date, not in the future |
| `category_id` | string | Required, must exist and have type `EXPENSE` |
| `notes` | string | Optional, max 500 chars |

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "type": "EXPENSE",
    "description": "Supermercado Extra",
    "amount_cents": 25000,
    "currency": "BRL",
    "purchase_date": "2026-02-28",
    "reference_month": "2026-02",
    "due_date": "2026-03-12",
    "category": { "id": "uuid", "name": "Alimentação" },
    "payment_method": { "id": "uuid", "label": "Nubank Gold" },
    "installment_info": null,
    "is_recurring": false,
    "notes": "Compra semanal",
    "created_at": "2026-03-07T14:00:00Z"
  }
}
```

The response returns the computed `reference_month` and `due_date` so the client can confirm the statement period.

**Status codes:** `201` · `400` Future purchase date · `403` Card not owned · `404` Card or category not found · `422` Validation failed

---

## Installment Plans

Installment purchases are a distinct resource because they create a multi-entity structure (plan + N transactions) and carry their own lifecycle.

### `POST /api/v1/installment-plans`

Creates an installment plan and atomically generates N transaction records.

**Request body:**
```json
{
  "payment_method_id": "uuid",
  "description": "iPhone 15 Pro",
  "total_amount_cents": 600000,
  "installment_count": 12,
  "purchase_date": "2026-02-20",
  "category_id": "uuid",
  "notes": "Parcelado Nubank"
}
```

| Field | Type | Rules |
|---|---|---|
| `installment_count` | number | Required, integer ≥ 2 |
| `total_amount_cents` | number | Required, integer > 0 |
| Other fields | — | Same as `POST /purchases` |

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "description": "iPhone 15 Pro",
    "total_amount_cents": 600000,
    "installment_count": 12,
    "installment_amount_cents": 50000,
    "first_reference_month": "2026-02",
    "purchase_date": "2026-02-20",
    "status": "ACTIVE",
    "currency": "BRL",
    "category": { "id": "uuid", "name": "Eletrônicos" },
    "payment_method": { "id": "uuid", "label": "Nubank Gold" },
    "installments": [
      {
        "transaction_id": "uuid",
        "installment_number": 1,
        "amount_cents": 50000,
        "reference_month": "2026-02",
        "due_date": "2026-03-12"
      },
      {
        "transaction_id": "uuid",
        "installment_number": 2,
        "amount_cents": 50000,
        "reference_month": "2026-03",
        "due_date": "2026-04-12"
      }
    ],
    "created_at": "2026-03-07T14:00:00Z"
  }
}
```

The full `installments` array is returned at creation time so the client immediately sees the computed schedule.

**Rounding note:** For `total_amount_cents = 1000` and `installment_count = 3`, installments are 333, 333, 334. The last installment absorbs the remainder.

**Status codes:** `201` · `400` Future purchase date · `422` `installment_count < 2` or validation failed

---

### `GET /api/v1/installment-plans`

Lists installment plans with derived remaining totals.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `status` | string | `ACTIVE`, `CANCELLED`, `COMPLETED` |
| `payment_method_id` | uuid | Filter by card |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "description": "iPhone 15 Pro",
      "total_amount_cents": 600000,
      "installment_count": 12,
      "installment_amount_cents": 50000,
      "first_reference_month": "2026-02",
      "status": "ACTIVE",
      "payment_method": { "id": "uuid", "label": "Nubank Gold" },
      "category": { "id": "uuid", "name": "Eletrônicos" },
      "remaining_installments": 11,
      "remaining_amount_cents": 550000,
      "next_installment_month": "2026-03"
    }
  ],
  "meta": { "total": 3, "page": 1, "limit": 20, "totalPages": 1 }
}
```

`remaining_installments`, `remaining_amount_cents`, and `next_installment_month` are derived at query time.

---

### `GET /api/v1/installment-plans/:id`

Returns a single plan with the complete `installments` array.

---

### `DELETE /api/v1/installment-plans/:id`

Cancels the plan. Soft-deletes all future installment transactions; preserves past ones.

**Response `200`:**
```json
{
  "data": {
    "plan_id": "uuid",
    "status": "CANCELLED",
    "cancelled_installments": 10,
    "preserved_installments": 2,
    "message": "2 past installments preserved. 10 future installments cancelled."
  }
}
```

**Status codes:** `200` · `409` Plan already cancelled or completed · `404` Not found

---

## Transactions

The transactions resource is the unified read surface for all money movements.

### `GET /api/v1/transactions`

Returns the user's transactions with flexible filtering.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `reference_month` | `YYYY-MM` | Primary filter; takes precedence over date range |
| `date_from` | ISO date | Used only when `reference_month` absent |
| `date_to` | ISO date | Used only when `reference_month` absent |
| `type` | string | `EXPENSE`, `INCOME` |
| `category_id` | uuid | |
| `payment_method_id` | uuid | |
| `is_installment` | boolean | |
| `is_recurring` | boolean | |
| `sort_by` | string | `transaction_date`, `amount_cents`, `reference_month`. Default: `transaction_date` |
| `sort_order` | string | `asc`, `desc`. Default: `desc` |

**Response `200`:** Paginated transaction list. Each item includes category, payment method, and installment/recurring context.

---

### `GET /api/v1/transactions/:id`

Returns a single transaction with full context.

For installment transactions, `installment_info` is populated:
```json
{
  "installment_info": {
    "plan_id": "uuid",
    "installment_number": 3,
    "total_installments": 12,
    "plan_description": "iPhone 15 Pro",
    "total_amount_cents": 600000
  }
}
```

---

### `POST /api/v1/transactions` *(Phase 5)*

Registers a direct expense not linked to a credit card (cash, PIX, boleto).

**Request body:**
```json
{
  "type": "EXPENSE",
  "description": "Aluguel março",
  "amount_cents": 180000,
  "transaction_date": "2026-03-05",
  "category_id": "uuid",
  "payment_method_id": null,
  "notes": "PIX para o proprietário"
}
```

**Validations:**
- `type`: `EXPENSE` only (income uses `/income`; investments in v1.1)
- `payment_method_id`: if provided, must not be type `CREDIT_CARD`
- `reference_month` is not accepted as input — computed from `transaction_date`

**Status codes:** `201` · `422` Validation failed

---

### `PATCH /api/v1/transactions/:id` *(Phase 5)*

Updates description, amount, category, or notes. `reference_month` and `transaction_date` are immutable.

**Request body (all optional):**
```json
{
  "description": "Supermercado Extra - atualizado",
  "amount_cents": 26500,
  "category_id": "uuid",
  "notes": "Compra semanal atualizada"
}
```

---

### `DELETE /api/v1/transactions/:id` *(Phase 5)*

Soft-deletes a single transaction. Returns a contextual note for installment or recurring transactions.

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "deleted_at": "2026-03-07T15:00:00Z",
    "note": "Installment transaction deleted. The parent plan remains active. Other installments are unaffected."
  }
}
```

---

## Recurring Transactions

### `POST /api/v1/recurring-transactions`

Creates a recurring transaction template.

**Request body:**
```json
{
  "type": "EXPENSE",
  "description": "Netflix Premium",
  "amount_cents": 5490,
  "currency": "BRL",
  "category_id": "uuid",
  "payment_method_id": "uuid",
  "start_month": "2026-03",
  "end_month": null,
  "day_of_month": 15
}
```

| Field | Type | Rules |
|---|---|---|
| `type` | string | `EXPENSE` or `INCOME` |
| `description` | string | Required, max 255 chars |
| `amount_cents` | number | Required, integer > 0 |
| `category_id` | string | Required; type must match `type` |
| `payment_method_id` | string | Required if `EXPENSE`; must be null if `INCOME` |
| `start_month` | string | Required, `YYYY-MM`; defaults to current month if omitted |
| `end_month` | string | Optional, `YYYY-MM`; must be ≥ `start_month` |
| `day_of_month` | number | Optional, 1–28; determines statement month if card-linked |

**Response `201`:** Template record including `recurrence_type: "MONTHLY"` and `is_active: true`.

**Status codes:** `201` · `422` Income type with payment method · `422` Category type mismatch

---

### `GET /api/v1/recurring-transactions`

Lists recurring templates with pagination.

**Query params:** `type`, `isActive`, `page`, `limit`

When `type=INCOME`, the API returns an **effective** `amountCents`:
- CLT + `applyTaxDeductions=true` -> `amountCents` is returned as **net** value.
- PJ/OTHER or `applyTaxDeductions=false` -> `amountCents` remains the configured gross value.

For INCOME templates, the response also includes:
- `grossAmountCents`
- `netAmountCents`
- `deductionCents`
- `taxBreakdown` (full INSS/IRRF preview when automatic deductions apply for CLT)

**Response `200`:**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "INCOME",
        "description": "Salário fixo",
        "amountCents": 582231,
        "grossAmountCents": 750000,
        "netAmountCents": 582231,
        "deductionCents": 167769,
        "applyTaxDeductions": true,
        "dependents": 0,
        "taxBreakdown": {
          "grossCents": 750000,
          "inssCents": 85150,
          "irrfCents": 82619,
          "dependentAllowanceTotalCents": 0,
          "netCents": 582231
        }
      }
    ],
    "total": 17,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### `GET /api/v1/recurring-transactions/:id`

Returns a single template with the same effective amount and tax preview semantics used by the list endpoint.

---

### `PATCH /api/v1/recurring-transactions/:id`

Updates template metadata. `start_month` is immutable.

**Request body (all optional):**
```json
{
  "description": "Netflix Premium 4K",
  "amount_cents": 6490,
  "category_id": "uuid",
  "end_month": "2026-12",
  "is_active": false
}
```

**Response `200`:** Updated template. Includes `warnings[]` if `amount_cents` changed:
```
"Amount updated. Previously generated transactions retain their original amount."
```

---

### `PATCH /api/v1/recurring-transactions/:id/activate`

Reactivates a paused template.

**Response `200`:**
```json
{ "data": { "id": "uuid", "is_active": true } }
```

---

### `PATCH /api/v1/recurring-transactions/:id/deactivate`

Pauses a template without deleting it.

**Response `200`:**
```json
{ "data": { "id": "uuid", "is_active": false } }
```

---

### `DELETE /api/v1/recurring-transactions/:id`

Soft-deletes the template. Previously generated transactions are preserved.

---

## Income

### `GET /api/v1/income/estimate`

Stateless CLT net income estimator. Does not require authentication.

**Query params:**

| Param | Required | Description |
|---|---|---|
| `gross_amount_cents` | Yes | Integer > 0 |
| `year` | Yes | e.g. `2026` |
| `dependents` | No | Integer ≥ 0, default `0` |

**Response `200`:**
```json
{
  "data": {
    "gross_amount_cents": 800000,
    "year": 2026,
    "dependents": 1,
    "inss": {
      "amount_cents": 77672,
      "brackets": [
        { "range": "R$ 0 – R$ 1.412,00", "rate": "7.5%", "amount_cents": 10590 }
      ]
    },
    "irrf": {
      "base_cents": 707528,
      "dependent_deduction_cents": 18960,
      "amount_cents": 85284,
      "brackets": [
        { "range": "R$ 4.664,68 – R$ 6.819,27", "rate": "22.5%", "amount_cents": 48506 }
      ]
    },
    "net_amount_cents": 637044
  }
}
```

**Status codes:** `200` · `404` No tax table found for the given year · `422` Validation failed

---

### `POST /api/v1/income`

Registers an income entry. Auto-calculates INSS and IRRF for CLT users. Creates a net income transaction.

**Request body:**
```json
{
  "reference_month": "2026-03",
  "description": "Salário março",
  "gross_amount_cents": 800000,
  "dependents": 1,
  "custom_deductions": [
    { "name": "Plano de Saúde", "amount_cents": 25000 },
    { "name": "VT", "amount_cents": 8000 }
  ]
}
```

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "reference_month": "2026-03",
    "description": "Salário março",
    "employment_type": "CLT",
    "gross_amount_cents": 800000,
    "deductions": [
      { "id": "uuid", "name": "INSS", "amount_cents": 77672, "is_auto_calculated": true },
      { "id": "uuid", "name": "IRRF", "amount_cents": 85284, "is_auto_calculated": true },
      { "id": "uuid", "name": "Plano de Saúde", "amount_cents": 25000, "is_auto_calculated": false },
      { "id": "uuid", "name": "VT", "amount_cents": 8000, "is_auto_calculated": false }
    ],
    "total_deductions_cents": 195956,
    "net_amount_cents": 604044,
    "transaction_id": "uuid",
    "currency": "BRL",
    "created_at": "2026-03-07T14:00:00Z"
  }
}
```

**Status codes:** `201` · `404` Tax table not found for year · `422` Net amount ≤ 0 after deductions

---

### `GET /api/v1/income`

Lists income entries with pagination.

**Query params:** `referenceMonth` (YYYY-MM), `page`, `limit`

**Response `200`:**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "referenceMonth": "2026-03",
        "grossCents": 800000,
        "netCents": 604044,
        "deductions": [
          { "description": "INSS", "amountCents": 77672, "isAutomatic": true },
          { "description": "IRRF", "amountCents": 85284, "isAutomatic": true }
        ]
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### `GET /api/v1/income/:id`

Returns a single income entry with full deduction detail.

---

### `PATCH /api/v1/income/:id`

Updates an income entry. Auto-deductions are fully recomputed on gross amount change.

**Request body:**
```json
{
  "gross_amount_cents": 850000,
  "custom_deductions": [
    { "name": "Plano de Saúde", "amount_cents": 27000 },
    { "name": "VT", "amount_cents": 8000 }
  ]
}
```

**Rules:** `reference_month` is immutable. `custom_deductions` is a full replacement. The linked net income transaction is updated automatically.

**Status codes:** `200` · `422` New net ≤ 0 after deductions

---

## Monthly Summary

### `GET /api/v1/summary/:month`

Returns the complete financial picture for a given reference month.

**Path param:** `:month` — `YYYY-MM`

**Important:** This endpoint has an internal write side-effect. Before aggregating, it idempotently generates any missing recurring transactions for the requested month. The client is not aware of this.

`total_deductions_cents` includes:
- deductions from manual income entries (`/income`), and
- automatic deductions from recurring INCOME templates when `applyTaxDeductions=true` (difference between gross template amount and generated net transaction amount).

The API also exposes:
- `manualDeductionCents` for deductions coming from manual income entries.
- `recurringDeductionCents` for deductions coming from recurring INCOME templates with automatic taxes.

**Response `200`:**
```json
{
  "data": {
    "reference_month": "2026-03",
    "income": {
      "gross_cents": 800000,
      "total_deductions_cents": 195956,
      "manual_deductions_cents": 28187,
      "recurring_deductions_cents": 167769,
      "net_cents": 604044,
      "entries_count": 1
    },
    "expenses": {
      "total_cents": 423500,
      "one_time_cents": 250000,
      "installment_cents": 100000,
      "recurring_cents": 73500,
      "by_category": [
        {
          "category_id": "uuid",
          "category_name": "Alimentação",
          "amount_cents": 150000,
          "pct_of_total": 35.4
        }
      ],
      "by_payment_method": [
        {
          "payment_method_id": "uuid",
          "label": "Nubank Gold",
          "type": "CREDIT_CARD",
          "amount_cents": 380000
        }
      ]
    },
    "balance_cents": 180544,
    "budget_comparison": null
  }
}
```

`budget_comparison` is `null` in MVP. Populated in v1.1 when a `MonthlyBudget` exists:
```json
"budget_comparison": {
  "total_limit_cents": 500000,
  "total_spent_cents": 423500,
  "remaining_cents": 76500,
  "pct_used": 84.7
}
```

**Status codes:** `200` · `400` Invalid month format

---

## Dashboard

### `GET /api/v1/dashboard`

Returns the current month summary and a forward projection. The primary entry point for a consumer's home screen.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `month` | `YYYY-MM` | Reference month; defaults to current month |
| `projection_months` | number | Forward months to project; default `3`, max `6` |

**Response `200`:**
```json
{
  "data": {
    "current_month": {
      "reference_month": "2026-03",
      "income": {
        "gross_cents": 800000,
        "total_deductions_cents": 195956,
        "manual_deductions_cents": 28187,
        "recurring_deductions_cents": 167769,
        "net_cents": 604044
      },
      "expenses": {
        "total_cents": 423500,
        "by_category": [ ]
      },
      "balance_cents": 180544
    },
    "projection": [
      {
        "month": "2026-04",
        "confidence": "HIGH",
        "projectedExpenseCents": 323500,
        "projectedIncomeCents": 604044,
        "projectedBalanceCents": 280544,
        "breakdown": {
          "installmentCents": 250000,
          "oneTimeCents": 0,
          "recurringExpenseCents": 73500,
          "recurringIncomeCents": 0,
          "committedIncomeCents": 604044
        }
      },
      {
        "month": "2026-05",
        "confidence": "MEDIUM",
        "projectedExpenseCents": 273500,
        "projectedIncomeCents": 0,
        "projectedBalanceCents": -273500,
        "breakdown": {
          "installmentCents": 200000,
          "oneTimeCents": 0,
          "recurringExpenseCents": 73500,
          "recurringIncomeCents": 0,
          "committedIncomeCents": 0
        }
      }
    ],
    "meta": {
      "generated_at": "2026-03-07T14:30:00Z",
      "projection_basis": "Open installment plans, already-registered one-time expenses, active recurring templates, and income entries already registered for future months. Recurring INCOME templates marked with applyTaxDeductions=true are projected using net amount for CLT users."
    }
  }
}
```

**Confidence levels:**
- `HIGH` — Next month: high certainty (confirmed installments + any registered income entry + active recurrings)
- `MEDIUM` — 2–3 months ahead: assumes recurrings continue; income projected only if already registered
- `LOW` — 4+ months (v1.1)

**Status codes:** `200` · `400` Invalid month format

---

## MVP Endpoint Priority Reference

| Endpoint | Method | Phase |
|---|---|---|
| `/auth/register` | POST | 0 — Essential |
| `/auth/login` | POST | 0 — Essential |
| `/users/me` | GET | 0 — Essential |
| `/income/estimate` | GET | 0 — Essential |
| `/categories` | GET | 0 — Essential |
| `/payment-methods` | POST | 1 — Essential |
| `/payment-methods` | GET | 1 — Essential |
| `/payment-methods/:id` | GET | 1 — Essential |
| `/payment-methods/:id/statement` | GET | 1 — Essential |
| `/purchases` | POST | 1 — Essential |
| `/installment-plans` | POST | 1 — Essential |
| `/installment-plans` | GET | 1 — Essential |
| `/installment-plans/:id` | GET | 1 — Essential |
| `/installment-plans/:id` | DELETE | 1 — Essential |
| `/transactions` | GET | 1 — Essential |
| `/transactions/:id` | GET | 1 — Essential |
| `/income` | POST | 2 — Essential |
| `/income` | GET | 2 — Essential |
| `/income/:id` | GET | 2 — Essential |
| `/income/:id` | PATCH | 2 — Essential |
| `/recurring-transactions` | POST | 3 — Essential |
| `/recurring-transactions` | GET | 3 — Essential |
| `/recurring-transactions/:id` | GET | 3 — Essential |
| `/recurring-transactions/:id` | PATCH | 3 — Essential |
| `/recurring-transactions/:id/activate` | PATCH | 3 — Essential |
| `/recurring-transactions/:id/deactivate` | PATCH | 3 — Essential |
| `/recurring-transactions/:id` | DELETE | 3 — Essential |
| `/summary/:month` | GET | 4 — Essential |
| `/dashboard` | GET | 4 — Essential |
| `/transactions` | POST | 5 — Polish |
| `/transactions/:id` | PATCH | 5 — Polish |
| `/transactions/:id` | DELETE | 5 — Polish |
| `/payment-methods/:id` | PATCH | 5 — Polish |
| `/payment-methods/:id` | DELETE | 5 — Polish |
| `/income/:id` | DELETE | 5 — Polish |
| `/users/me` | PATCH | 5 — Polish |
| `/budgets` | POST/GET/PATCH | v1.1 |
| `/investment-plans` | POST/GET/PATCH | v1.1 |
| `/categories` | POST/PATCH/DELETE | v1.1 |
