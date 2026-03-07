"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedResourceException = exports.EntityNotFoundException = exports.BusinessRuleException = void 0;
class BusinessRuleException extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'BusinessRuleException';
    }
}
exports.BusinessRuleException = BusinessRuleException;
class EntityNotFoundException extends Error {
    constructor(entity, id) {
        super(id ? `${entity} with id '${id}' not found` : `${entity} not found`);
        this.entity = entity;
        this.id = id;
        this.name = 'EntityNotFoundException';
    }
}
exports.EntityNotFoundException = EntityNotFoundException;
class UnauthorizedResourceException extends Error {
    constructor(resource = 'Resource') {
        super(`${resource} does not belong to the authenticated user`);
        this.name = 'UnauthorizedResourceException';
    }
}
exports.UnauthorizedResourceException = UnauthorizedResourceException;
//# sourceMappingURL=domain.exceptions.js.map