import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserSummaryDto } from '../../common/dto/user-response.dto';

export class ActivityLogResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId: string | null;

  @ApiProperty()
  action: string;

  @ApiPropertyOptional({ nullable: true })
  entityType: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  entityId: string | null;

  @ApiPropertyOptional({ nullable: true })
  summary: string | null;

  @ApiProperty({ type: 'object', additionalProperties: true })
  metadata: Record<string, unknown>;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiPropertyOptional({ type: UserSummaryDto, nullable: true })
  user?: UserSummaryDto | null;
}
