import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaAssetResponseDto } from '../../common/dto/media-asset-response.dto';

export class AboutHighlightResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  aboutUsId: string;

  @ApiPropertyOptional({ nullable: true })
  titleEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  titleTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionTh: string | null;

  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class AboutUsResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiPropertyOptional({ nullable: true })
  companyTitleEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  companyTitleTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  bioEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  bioTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  teamPageTitleEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  teamPageTitleTh: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  teamHeaderImageId: string | null;

  @ApiPropertyOptional({ type: MediaAssetResponseDto, nullable: true })
  teamHeaderImage?: MediaAssetResponseDto | null;

  @ApiProperty()
  isSingleton: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ type: [AboutHighlightResponseDto] })
  highlights: AboutHighlightResponseDto[];
}
