# Fluxo completo e correto da API

---

## 1. Autenticação

### Registro
```json
POST /api/v1/auth/register
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "employmentType": "CLT"
}
```
Retorna JWT diretamente. `employmentType` aceita `CLT`, `PJ` ou `OTHER`.

### Login
```json
POST /api/v1/auth/login
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

Todas as chamadas seguintes exigem o header `Authorization: Bearer <token>`.

---

## 2. Configuração inicial

### Categorias

O sistema já possui categorias pré-criadas globalmente (`isSystem: true`), compartilhadas entre todos os usuários — criadas uma única vez via `npm run db:seed`. Você pode listar e criar as suas:

```
GET /api/v1/categories?type=EXPENSE   → categorias de despesa
GET /api/v1/categories?type=INCOME    → categorias de renda
```

```json
POST /api/v1/categories
{
  "name": "Pets",
  "type": "EXPENSE"
}
```

O `type` é imutável depois de criado. Categorias de sistema não podem ser editadas ou deletadas.

```
PATCH  /api/v1/categories/{uuid}   → renomear (apenas as suas)
DELETE /api/v1/categories/{uuid}   → remover (erro 422 se estiver em uso)
```

### Meios de pagamento

```json
POST /api/v1/payment-methods
{
  "name": "Nubank",
  "type": "CREDIT_CARD",
  "creditCard": {
    "closingDay": 3,
    "dueDay": 10,
    "creditLimitCents": 500000
  }
}
```

Tipos válidos: `CREDIT_CARD`, `DEBIT_CARD`, `PIX`, `CASH`, `OTHER`. Somente `CREDIT_CARD` exige o bloco `creditCard`. O `id` retornado é o UUID que você usará nos lançamentos.

```
GET    /api/v1/payment-methods            → listar todos
GET    /api/v1/payment-methods/{uuid}     → ver um
PATCH  /api/v1/payment-methods/{uuid}     → atualizar nome/limite
DELETE /api/v1/payment-methods/{uuid}     → remover (bloqueado se tiver parcelas futuras pendentes)
```

---

## 3. Registrando Ganhos (Renda)

```json
POST /api/v1/income
{
  "referenceMonth": "2026-03",
  "grossCents": 800000,
  "description": "Salário",
  "applyTaxDeductions": true,
  "dependents": 0,
  "categoryId": "uuid-da-categoria-de-renda",
  "customDeductions": [
    { "description": "Plano de saúde", "amountCents": 30000 }
  ]
}
```

Campos obrigatórios: `referenceMonth`, `grossCents`.  
Campos opcionais: `description` (padrão: `"Salário"`), `applyTaxDeductions` (padrão: `true`), `dependents` (padrão: 0), `categoryId`, `notes`, `customDeductions`.

**O que acontece internamente:**
- Para usuário `CLT` com `applyTaxDeductions: true` (padrão): INSS e IRRF são calculados automaticamente com base nas tabelas progressivas armazenadas no banco.
- Para usuário `CLT` com `applyTaxDeductions: false`: não há deduções automáticas de INSS/IRRF.
- Para `PJ`/`OTHER`: nenhuma dedução automática.
- O `netCents` é calculado e uma `Transaction` de tipo `INCOME` é criada no ledger com o valor líquido.
- Se `categoryId` for informado, ele precisa ser uma categoria de tipo `INCOME` (do usuário ou de sistema) e será aplicado na `Transaction` vinculada.
- Você pode registrar **múltiplas entradas de renda no mesmo mês** (ex: salário + freela + bônus).

```
GET    /api/v1/income            → listar todos os lançamentos
GET    /api/v1/income/estimate   → calculadora pública de INSS/IRRF (sem auth)
GET    /api/v1/income/{uuid}     → ver um lançamento com deduções detalhadas
PATCH  /api/v1/income/{uuid}     → atualizar
DELETE /api/v1/income/{uuid}     → remover (soft delete)
```

---

## 4. Registrando Despesas

Existem **quatro formas** de registrar despesas, cada uma com endpoint e propósito distintos:

---

### 4a. Despesa direta — `POST /api/v1/transactions`

Para gastos pagos com PIX, débito, dinheiro ou qualquer meio **que não seja cartão de crédito**.

```json
POST /api/v1/transactions
{
  "description": "Supermercado",
  "amountCents": 15000,
  "transactionDate": "2026-03-07",
  "paymentMethodId": "uuid-do-meio-de-pagamento",
  "categoryId": "uuid-da-categoria",
  "notes": "opcional"
}
```

Campos obrigatórios: `description`, `amountCents`, `transactionDate`.  
Campos opcionais: `paymentMethodId`, `categoryId`, `notes`.

**Regras:**
- Cartão de crédito (`CREDIT_CARD`) é **rejeitado** neste endpoint.
- O `referenceMonth` é calculado automaticamente a partir de `transactionDate` (ex: `2026-03-07` → `2026-03`).
- Pode ser editada (`PATCH`) ou removida (`DELETE`) depois — apenas transações `ONE_TIME` permitem edição.

```
GET    /api/v1/transactions                → listar com filtros (veja abaixo)
GET    /api/v1/transactions/{uuid}         → ver uma transação
PATCH  /api/v1/transactions/{uuid}         → editar (só transações ONE_TIME)
DELETE /api/v1/transactions/{uuid}         → remover (só transações ONE_TIME)
```

---

### 4b. Compra à vista no crédito — `POST /api/v1/purchases`

Para compras no cartão de crédito, **sem parcelamento** (valor inteiro em uma única fatura).

```json
POST /api/v1/purchases
{
  "paymentMethodId": "uuid-do-cartao-de-credito",
  "description": "Restaurante",
  "amountCents": 15000,
  "purchaseDate": "2026-03-07",
  "categoryId": "uuid-da-categoria",
  "notes": "opcional"
}
```

Campos obrigatórios: `paymentMethodId`, `description`, `amountCents`, `purchaseDate`.  
Campos opcionais: `categoryId`, `notes`.

**Regras:**
- Aceita **somente** `CREDIT_CARD` como `paymentMethodId`.
- O `referenceMonth` é calculado pelo `closingDay` do cartão:
  - Compra no dia 07, `closingDay = 3` → 07 > 03 → cai na fatura de **abril** (`2026-04`)
  - Compra no dia 02, `closingDay = 3` → 02 ≤ 03 → cai na fatura de **março** (`2026-03`)
- Cria 1 transação com `origin: ONE_TIME`.
- Não aceita `installmentCount` — para parcelamento use `/installment-plans`.

---

### 4c. Compra parcelada no crédito — `POST /api/v1/installment-plans`

Para compras no cartão de crédito **divididas em 2 ou mais parcelas**.

```json
POST /api/v1/installment-plans
{
  "paymentMethodId": "uuid-do-cartao-de-credito",
  "description": "iPhone 16",
  "totalAmountCents": 420000,
  "installmentCount": 12,
  "purchaseDate": "2026-03-08",
  "categoryId": "uuid-da-categoria",
  "notes": "opcional"
}
```

Campos obrigatórios: `paymentMethodId`, `description`, `totalAmountCents`, `installmentCount` (mínimo 2), `purchaseDate`.  
Campos opcionais: `categoryId`, `notes`.

**O que acontece internamente:**
- Aceita **somente** `CREDIT_CARD`.
- Calcula o mês da primeira parcela pelo `closingDay` (mesma regra acima).
- Divide o valor: divisão inteira, o **centavo do arredondamento vai para a última parcela**.
  - Ex: R$ 100,00 em 3x → R$ 33,33 / R$ 33,33 / **R$ 33,34**
- Cria 1 `InstallmentPlan` + N `Transaction`s com `origin: INSTALLMENT`, cada uma no mês correto.
- **Consumo de limite:** o limite do cartão é comprometido pelo **valor total da compra** no momento da criação do plano. Na fatura mensal entra apenas a parcela do mês, mas o endpoint `GET /payment-methods/{uuid}/statement` também retorna `committedLimitCents`, que soma a parcela atual + todas as futuras já criadas para aquele cartão a partir do mês consultado.

```
GET    /api/v1/installment-plans            → listar todos os planos
GET    /api/v1/installment-plans/{uuid}     → ver o cronograma completo (todas as parcelas)
DELETE /api/v1/installment-plans/{uuid}     → cancelar (parcelas futuras viram CANCELLED)
```

---

### 4d. Despesas/rendas recorrentes — `POST /api/v1/recurring-transactions`

Para despesas ou rendas que **se repetem todo mês**: Netflix, aluguel, salário fixo, etc.

```json
POST /api/v1/recurring-transactions
{
  "description": "Salário",
  "amountCents": 800000,
  "type": "INCOME",
  "startMonth": "2026-01",
  "endMonth": "2026-12",
  "applyTaxDeductions": true,
  "dependents": 0,
  "categoryId": "uuid-da-categoria",
  "notes": "opcional"
}
```

Campos obrigatórios: `description`, `amountCents`, `type` (`EXPENSE` ou `INCOME`), `startMonth`.  
Campos opcionais: `endMonth` (sem ele, dura indefinidamente), `dayOfMonth`, `paymentMethodId`, `categoryId`, `notes`, `applyTaxDeductions`, `dependents`.

**Regras importantes:**
- `type: INCOME` **não pode ter** `paymentMethodId`.
- Se `paymentMethodId` for um `CREDIT_CARD`, o campo `dayOfMonth` é **obrigatório** (usado para calcular o mês da fatura).
- `applyTaxDeductions: true` é **exclusivo para `type: INCOME`** — retorna erro 422 se usado com `EXPENSE`.
- Quando `applyTaxDeductions: true`:
  - `amountCents` é tratado como **salário bruto**.
  - Para usuários `CLT`: INSS e IRRF são calculados automaticamente no momento da geração, usando as tabelas progressivas do banco. O valor registrado na transação gerada é o **valor líquido** (após deduções automáticas).
  - Para usuários `PJ`/`OTHER`: nenhuma dedução automática — o valor bruto é usado como-está.
  - Use o campo `dependents` para informar o número de dependentes no cálculo do IRRF (padrão: 0).
- **Diferença em relação a `POST /income`:** o endpoint `/income` cria registros de renda manuais com detalhamento completo das deduções (INSS por faixa, IRRF etc.). O recorrente com `applyTaxDeductions` apenas registra o valor líquido na transação gerada — sem detalhamento de deduções armazenado separadamente.
- Isso cria apenas um **template** — as transações reais são geradas automaticamente quando você consulta `GET /summary/:month`.
- **Não existe** endpoint de geração manual — é 100% automático via `/summary`.
- Para recorrentes de despesa em `CREDIT_CARD`, cada transação **já materializada** também entra no `committedLimitCents` da fatura do cartão. Recorrências futuras ainda não materializadas não reservam limite antecipadamente.

```
GET    /api/v1/recurring-transactions                     → listar templates
GET    /api/v1/recurring-transactions/{uuid}              → ver um template
PATCH  /api/v1/recurring-transactions/{uuid}              → atualizar
PATCH  /api/v1/recurring-transactions/{uuid}/activate     → reativar
PATCH  /api/v1/recurring-transactions/{uuid}/deactivate   → pausar
DELETE /api/v1/recurring-transactions/{uuid}              → remover (soft delete)
```

---

## 5. Consultando — Extrato, Summary, Dashboard

### Fatura do cartão

```
GET /api/v1/payment-methods/{uuid}/statement?month=2026-04
```

Lista todas as transações daquele cartão naquele mês de referência, com total somado. Inclui compras à vista, parcelas e recorrentes já materializados.

Além dos itens da fatura, a resposta também informa:
- `totalCents` — valor cobrado **naquela fatura**
- `committedLimitCents` — quanto do limite já está comprometido naquele cartão a partir do mês consultado
- `availableLimitCents` — `creditLimitCents - committedLimitCents` (ou `null` se o cartão não tiver limite configurado)

Exemplo: cartão com limite de R$ 10.000, compra de R$ 5.000 em 10x. Na fatura do mês entra apenas R$ 500, mas `committedLimitCents` será R$ 5.000 e `availableLimitCents` será R$ 5.000 enquanto as parcelas futuras existirem.

---

### Listar todas as transações (ledger unificado)

```
GET /api/v1/transactions?reference_month=2026-03&type=EXPENSE&origin=INSTALLMENT&payment_method_id={uuid}&category_id={uuid}&page=1&limit=20
```

Todos os filtros são opcionais.

| Parâmetro | Valores válidos |
|---|---|
| `type` | `EXPENSE`, `INCOME` |
| `origin` | `ONE_TIME`, `INSTALLMENT`, `RECURRING`, `INCOME` |
| `reference_month` | formato `YYYY-MM` |
| `payment_method_id` | UUID do meio de pagamento |
| `category_id` | UUID da categoria |
| `page` | número da página (padrão: 1) |
| `limit` | itens por página (padrão: 20, máximo: 100) |

---

### Summary do mês

```
GET /api/v1/summary/2026-03
```

**Aqui acontece a geração dos recorrentes:** ao chamar este endpoint, os templates de `recurring-transactions` ativos naquele mês são automática e idempotentemente convertidos em transações reais. Chamar duas vezes não duplica nada.

Retorna:
- `totalGrossCents` — soma da renda bruta do mês (via `POST /income`)
- `totalNetIncomeCents` — renda líquida total: `sum(incomeEntries.netCents)` + `recurringIncomeCents`
- `totalDeductionCents` — soma total de deduções das entradas de renda (via `POST /income`)
- `totalExpenseCents` — total de despesas
- `oneTimeCents` — despesas diretas e à vista no crédito
- `installmentCents` — parcelas vencendo no mês
- `recurringExpenseCents` — recorrentes de despesa gerados no mês
- `recurringIncomeCents` — recorrentes de renda gerados no mês (ex: salário fixo cadastrado em `/recurring-transactions`)
- `balanceCents` — `totalNetIncomeCents − totalExpenseCents`
- `byCategory` — breakdown de despesas por categoria
- `byPaymentMethod` — breakdown de despesas por meio de pagamento
- `transactions` — todas as transações do mês
- `incomeEntries` — lançamentos de renda do mês (lista, pode estar vazia)

---

### Dashboard com projeções

```
GET /api/v1/dashboard?month=2026-03&projectionMonths=3
```

Ambos os parâmetros são opcionais (`month` padrão = mês atual, `projectionMonths` padrão = 3, máximo 12).

Retorna o summary do mês atual **mais** projeções dos próximos N meses. Para cada mês futuro, calcula:
- Parcelas já criadas no banco para aquele mês (certeza absoluta)
- Templates recorrentes ativos naquele mês (previsão)

Níveis de confiança:
- `HIGH` → mês+1
- `MEDIUM` → mês+2 e mês+3
- `LOW` → mês+4 em diante

> **Atenção:** a projeção de renda futura inclui apenas recorrentes de `type: INCOME`. O salário registrado manualmente via `/income` **não** é projetado automaticamente.

---

## 6. Orçamento mensal (opcional)

```json
POST /api/v1/budgets
{
  "referenceMonth": "2026-03",
  "totalBudgetCents": 500000,
  "allocations": [
    { "label": "Alimentação", "allocatedCents": 150000, "categoryId": "uuid-opcional" },
    { "label": "Transporte", "allocatedCents": 80000 }
  ]
}
```

- Um orçamento por mês por usuário.
- As alocações são substituídas atomicamente ao fazer PATCH.

```
GET    /api/v1/budgets              → listar todos os orçamentos
GET    /api/v1/budgets/2026-03      → ver orçamento de um mês específico
PATCH  /api/v1/budgets/2026-03      → atualizar (substitui todas as alocações)
DELETE /api/v1/budgets/2026-03      → remover
```

---

## Mapa completo: o que cada endpoint faz

| Endpoint | O que faz de fato |
|---|---|
| `POST /purchases` | Compra **à vista** no crédito — cria 1 transação no mês da fatura |
| `POST /installment-plans` | Compra **parcelada** no crédito — cria N transações (uma por mês) |
| `POST /transactions` | Despesa direta via PIX, débito, dinheiro — **não aceita cartão de crédito** |
| `POST /recurring-transactions` | Cria **template** de transação recorrente (despesa ou renda mensal) |
| `POST /income` | Lança **rendas manuais** (inclusive múltiplas no mês) com cálculo automático opcional de INSS/IRRF (CLT) |
| `GET /summary/:month` | Fecha o mês, **gera os recorrentes automaticamente**, retorna totais e breakdowns |
| `GET /dashboard` | Summary atual + **projeções de meses futuros** baseadas em parcelas e recorrentes |
| `GET /payment-methods/:id/statement` | Fatura de um cartão num mês específico |
| `GET /transactions` | Ledger unificado com filtros e paginação |

---

## Como toda movimentação vira transação

Independente do endpoint usado, todo lançamento financeiro acaba na tabela `transactions`. O campo `origin` indica a origem:

| `origin` | Criado por |
|---|---|
| `ONE_TIME` | `POST /transactions` ou `POST /purchases` |
| `INSTALLMENT` | `POST /installment-plans` (N transações geradas na criação) |
| `RECURRING` | Gerado automaticamente pelo `GET /summary/:month` |
| `INCOME` | `POST /income` |

O `GET /transactions` com filtros é o ledger completo — você enxerga tudo em um lugar só.
