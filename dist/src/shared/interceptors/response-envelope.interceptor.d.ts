import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface ApiResponse<T> {
    data: T;
}
export declare class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>>;
}
