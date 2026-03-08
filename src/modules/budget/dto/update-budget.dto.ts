import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { CreateBudgetAllocationDto } from './create-budget.dto';

export class UpdateBudgetDto {
  @ApiPropertyOptional({ description: 'New total monthly budget in BRL cents', example: 600000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalBudgetCents?: number;

  @ApiPropertyOptional({
    type: [CreateBudgetAllocationDto],
    description: 'Replaces all existing allocations when provided',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetAllocationDto)
  allocations?: CreateBudgetAllocationDto[];
}
