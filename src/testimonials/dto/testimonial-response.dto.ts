import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';
import { MediaAssetResponseDto } from '../../common/dto/media-asset-response.dto';

export class CounselorSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  fullNameEn: string;

  @ApiPropertyOptional({ nullable: true })
  fullNameTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  positionEn: string | null;
}

export class TestimonialResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  studentNameEn: string;

  @ApiPropertyOptional({ nullable: true })
  studentNameTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  locationEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  locationTh: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  counselorId: string | null;

  @ApiPropertyOptional({ type: CounselorSummaryDto, nullable: true })
  counselor?: CounselorSummaryDto | null;

  @ApiPropertyOptional({ nullable: true })
  contentEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  contentTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  rating: number | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  portraitImageId: string | null;

  @ApiPropertyOptional({ type: MediaAssetResponseDto, nullable: true })
  portraitImage?: MediaAssetResponseDto | null;

  @ApiProperty({ enum: ReviewStatus })
  status: ReviewStatus;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
