"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateInstallmentAmounts = calculateInstallmentAmounts;
exports.computeInstallmentReferenceMonths = computeInstallmentReferenceMonths;
function calculateInstallmentAmounts(totalCents, count) {
    const base = totalCents / BigInt(count);
    const remainder = totalCents % BigInt(count);
    const amounts = Array.from({ length: count }, () => base);
    amounts[count - 1] += remainder;
    return amounts;
}
function computeInstallmentReferenceMonths(firstMonth, count) {
    const [yearStr, monthStr] = firstMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) - 1;
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
//# sourceMappingURL=installment-calculator.js.map