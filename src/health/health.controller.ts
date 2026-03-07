import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../shared/database/prisma.service';
import { Public } from '../shared/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealthIndicator: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      () =>
        this.prismaHealthIndicator.pingCheck('database', this.prisma as never),
    ]);
  }
}
