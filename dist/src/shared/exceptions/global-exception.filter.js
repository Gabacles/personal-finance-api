"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const domain_exceptions_1 = require("./domain.exceptions");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const errorResponse = this.buildErrorResponse(exception, request.url);
        if (errorResponse.statusCode >= 500) {
            this.logger.error(`[${request.method}] ${request.url} → ${errorResponse.statusCode}`, exception instanceof Error ? exception.stack : String(exception));
        }
        response.status(errorResponse.statusCode).json(errorResponse);
    }
    buildErrorResponse(exception, path) {
        const timestamp = new Date().toISOString();
        if (exception instanceof domain_exceptions_1.EntityNotFoundException) {
            return {
                statusCode: common_1.HttpStatus.NOT_FOUND,
                error: 'Not Found',
                message: exception.message,
                timestamp,
                path,
            };
        }
        if (exception instanceof domain_exceptions_1.BusinessRuleException) {
            return {
                statusCode: common_1.HttpStatus.UNPROCESSABLE_ENTITY,
                error: 'Business Rule Violation',
                message: exception.message,
                code: exception.code,
                timestamp,
                path,
            };
        }
        if (exception instanceof domain_exceptions_1.UnauthorizedResourceException) {
            return {
                statusCode: common_1.HttpStatus.FORBIDDEN,
                error: 'Forbidden',
                message: exception.message,
                timestamp,
                path,
            };
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            const message = typeof exceptionResponse === 'string'
                ? exceptionResponse
                : exceptionResponse.message;
            return {
                statusCode: status,
                error: exception.name,
                message: Array.isArray(message) ? message.join('; ') : message,
                timestamp,
                path,
            };
        }
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
            message: 'An unexpected error occurred',
            timestamp,
            path,
        };
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map