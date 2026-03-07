export declare class BusinessRuleException extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
export declare class EntityNotFoundException extends Error {
    readonly entity: string;
    readonly id?: string | undefined;
    constructor(entity: string, id?: string | undefined);
}
export declare class UnauthorizedResourceException extends Error {
    constructor(resource?: string);
}
