import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ToBoolean } from '../../common/dto/transforms';
import { StaffStatus } from '../../common/enums';

export class StaffQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: StaffStatus })
  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isVisible?: boolean;
}
