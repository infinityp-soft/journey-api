import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { EventFormat, EventStatus } from '../../common/enums';

export class EventQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ enum: EventFormat })
  @IsOptional()
  @IsEnum(EventFormat)
  format?: EventFormat;
}

export class EventRegistrationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'Study in UK' })
  @IsOptional()
  @IsString()
  areaOfInterest?: string;
}
