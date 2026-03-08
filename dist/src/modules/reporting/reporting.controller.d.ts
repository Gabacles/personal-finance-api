import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { SummaryService } from './summary.service';
declare class DashboardQueryDto {
    month?: string;
    projectionMonths?: number;
}
export declare class ReportingController {
    private readonly summaryService;
    private readonly dashboardService;
    constructor(summaryService: SummaryService, dashboardService: DashboardService);
    getMonthSummary(user: AuthenticatedUser, month: string): Promise<import("./summary.service").MonthlySummary>;
    getDashboard(user: AuthenticatedUser, query: DashboardQueryDto): Promise<import("./dashboard.service").Dashboard>;
}
export {};
