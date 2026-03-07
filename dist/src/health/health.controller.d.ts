import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../shared/database/prisma.service';
export declare class HealthController {
    private readonly health;
    private readonly prismaHealthIndicator;
    private readonly prisma;
    constructor(health: HealthCheckService, prismaHealthIndicator: PrismaHealthIndicator, prisma: PrismaService);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"database">, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"database">> | undefined, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"database">> | undefined>>;
}
