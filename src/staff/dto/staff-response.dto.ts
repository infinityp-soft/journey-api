import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StaffStatus } from '@prisma/client';
import { MediaAssetResponseDto } from '../../common/dto/media-asset-response.dto';

export class StaffMemberResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  fullNameEn: string;

  @ApiPropertyOptional({ nullable: true })
  fullNameTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  positionEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  positionTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  email: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  photoId: string | null;

  @ApiPropertyOptional({ type: MediaAssetResponseDto, nullable: true })
  photo?: MediaAssetResponseDto | null;

  @ApiProperty({ enum: StaffStatus })
  status: StaffStatus;

  @ApiProperty()
  isVisible: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
