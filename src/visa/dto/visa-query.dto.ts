import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SimpleStatus } from '../../common/enums';

export class VisaQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SimpleStatus })
  @IsOptional()
  @IsEnum(SimpleStatus)
  status?: SimpleStatus;

  @ApiPropertyOptional({ example: 'Australia' })
  @IsOptional()
  @IsString()
  country?: string;
}
