import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaAssetResponseDto } from '../../common/dto/media-asset-response.dto';

export class BannerResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  linkUrl: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  imageId: string | null;

  @ApiPropertyOptional({ type: MediaAssetResponseDto, nullable: true })
  image?: MediaAssetResponseDto | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
