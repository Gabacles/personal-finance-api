"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeStatementMonth = computeStatementMonth;
function computeStatementMonth(closingDay, purchaseDate) {
    const purchaseDay = purchaseDate.getUTCDate();
    const purchaseYear = purchaseDate.getUTCFullYear();
    const purchaseMonth = purchaseDate.getUTCMonth();
    let statementYear = purchaseYear;
    let statementMonth = purchaseMonth;
    if (purchaseDay > closingDay) {
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
//# sourceMappingURL=credit-card-statement.service.js.map