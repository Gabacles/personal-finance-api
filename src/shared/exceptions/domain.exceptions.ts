export class BusinessRuleException extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'BusinessRuleException';
  }
}

export class EntityNotFoundException extends Error {
  constructor(
    public readonly entity: string,
    public readonly id?: string,
  ) {
    super(id ? `${entity} with id '${id}' not found` : `${entity} not found`);
    this.name = 'EntityNotFoundException';
  }
}

export class UnauthorizedResourceException extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} does not belong to the authenticated user`);
    this.name = 'UnauthorizedResourceException';
  }
}
