import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublishStatus } from '@prisma/client';
import { MediaAssetResponseDto } from '../../common/dto/media-asset-response.dto';

export class VideoPageSettingsResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiPropertyOptional({ nullable: true })
  pageTitleEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  pageTitleTh: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  headerImageId: string | null;

  @ApiPropertyOptional({ type: MediaAssetResponseDto, nullable: true })
  headerImage?: MediaAssetResponseDto | null;

  @ApiProperty()
  isSingleton: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class VideoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiPropertyOptional({ nullable: true })
  titleEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  titleTh: string | null;

  @ApiProperty()
  youtubeUrl: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  thumbnailId: string | null;

  @ApiPropertyOptional({ type: MediaAssetResponseDto, nullable: true })
  thumbnail?: MediaAssetResponseDto | null;

  @ApiProperty({ enum: PublishStatus })
  status: PublishStatus;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
