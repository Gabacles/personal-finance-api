import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  BusinessRuleException,
  EntityNotFoundException,
  UnauthorizedResourceException,
} from './domain.exceptions';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  code?: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request.url);

    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${errorResponse.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, path: string): ErrorResponse {
    const timestamp = new Date().toISOString();

    if (exception instanceof EntityNotFoundException) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: exception.message,
        timestamp,
        path,
      };
    }

    if (exception instanceof BusinessRuleException) {
      return {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'Business Rule Violation',
        message: exception.message,
        code: exception.code,
        timestamp,
        path,
      };
    }

    if (exception instanceof UnauthorizedResourceException) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
        message: exception.message,
        timestamp,
        path,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as { message: string | string[] }).message;

      return {
        statusCode: status,
        error: exception.name,
        message: Array.isArray(message) ? message.join('; ') : message,
        timestamp,
        path,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      timestamp,
      path,
    };
  }
}
