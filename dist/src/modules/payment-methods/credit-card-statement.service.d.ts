export interface StatementResult {
    referenceMonth: string;
}
export declare function computeStatementMonth(closingDay: number, purchaseDate: Date): StatementResult;
