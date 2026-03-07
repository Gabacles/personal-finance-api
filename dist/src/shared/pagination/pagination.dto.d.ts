export declare class PaginationDto {
    page: number;
    limit: number;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare function buildPaginatedResponse<T>(items: T[], total: number, page: number, limit: number): PaginatedResponse<T>;
