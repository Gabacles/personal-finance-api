/**
 * Pure computation functions for credit card statement month logic.
 * No framework dependencies — safe to unit-test in isolation.
 *
 * Business rule:
 *   If purchaseDay <= closingDay  → statement month = purchase month
 *   If purchaseDay  > closingDay  → statement month = purchase month + 1
 */

export interface StatementResult {
  /** YYYY-MM format */
  referenceMonth: string;
}

/**
 * Computes the credit-card statement reference month for a given purchase date.
 *
 * @param closingDay  Day-of-month the card closes (1–31)
 * @param purchaseDate  The actual purchase date
 * @returns StatementResult with referenceMonth in YYYY-MM format
 */
export function computeStatementMonth(
  closingDay: number,
  purchaseDate: Date,
): StatementResult {
  const purchaseDay = purchaseDate.getUTCDate();
  const purchaseYear = purchaseDate.getUTCFullYear();
  const purchaseMonth = purchaseDate.getUTCMonth(); // 0-indexed

  let statementYear = purchaseYear;
  let statementMonth = purchaseMonth; // 0-indexed

  if (purchaseDay > closingDay) {
    // rolls into next month's statement
    statementMonth += 1;
    if (statementMonth > 11) {
      statementMonth = 0;
      statementYear += 1;
    }
  }

  const mm = String(statementMonth + 1).padStart(2, '0');
  const referenceMonth = `${statementYear}-${mm}`;

  return { referenceMonth };
}
