import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublishStatus } from '@prisma/client';
import { MediaAssetResponseDto } from '../../common/dto/media-asset-response.dto';

export class DestinationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nameEn: string;

  @ApiPropertyOptional({ nullable: true })
  nameTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  shortDescEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  shortDescTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  contentEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  contentTh: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  coverImageId: string | null;

  @ApiPropertyOptional({ type: MediaAssetResponseDto, nullable: true })
  coverImage?: MediaAssetResponseDto | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  flagImageId: string | null;

  @ApiPropertyOptional({ type: MediaAssetResponseDto, nullable: true })
  flagImage?: MediaAssetResponseDto | null;

  @ApiProperty({ enum: PublishStatus })
  status: PublishStatus;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
