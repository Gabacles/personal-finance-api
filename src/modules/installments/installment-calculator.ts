/**
 * Pure computation functions for installment plan logic.
 * No framework dependencies — safe to unit-test in isolation.
 */

/**
 * Splits a total amount (in cents) into N installments.
 * The remainder (from integer division) is added to the LAST installment.
 *
 * @param totalCents  Total amount in cents (must be > 0)
 * @param count       Number of installments (must be >= 2)
 * @returns Array of cent amounts, length === count
 */
export function calculateInstallmentAmounts(
  totalCents: bigint,
  count: number,
): bigint[] {
  const base = totalCents / BigInt(count);
  const remainder = totalCents % BigInt(count);

  const amounts = Array.from({ length: count }, () => base);
  amounts[count - 1] += remainder;

  return amounts;
}

/**
 * Generates reference months (YYYY-MM) for each installment, starting from
 * `firstMonth` and incrementing monthly.
 *
 * @param firstMonth  YYYY-MM string of the first installment
 * @param count       Number of installments
 * @returns Array of YYYY-MM strings, length === count
 */
export function computeInstallmentReferenceMonths(
  firstMonth: string,
  count: number,
): string[] {
  const [yearStr, monthStr] = firstMonth.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1; // 0-indexed

  return Array.from({ length: count }, () => {
    const mm = String(month + 1).padStart(2, '0');
    const ref = `${year}-${mm}`;

    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }

    return ref;
  });
}
