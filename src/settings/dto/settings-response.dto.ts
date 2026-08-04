import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SocialPlatform } from '@prisma/client';
import { MediaAssetResponseDto } from '../../common/dto/media-asset-response.dto';

export class SiteSettingsResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  contactCoverImageId: string | null;

  @ApiPropertyOptional({ type: MediaAssetResponseDto, nullable: true })
  contactCoverImage?: MediaAssetResponseDto | null;

  @ApiPropertyOptional({ nullable: true })
  contactTitleEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  contactTitleTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  addressEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  addressTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  primaryPhone: string | null;

  @ApiPropertyOptional({ nullable: true })
  inquiryEmail: string | null;

  @ApiPropertyOptional({ nullable: true })
  googleMapLink: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  logoId: string | null;

  @ApiPropertyOptional({ type: MediaAssetResponseDto, nullable: true })
  logo?: MediaAssetResponseDto | null;

  @ApiPropertyOptional({ nullable: true })
  footerBioEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  footerBioTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  defaultSeoTitle: string | null;

  @ApiPropertyOptional({ nullable: true })
  defaultSeoDescription: string | null;

  @ApiProperty()
  siteVisits: number;

  @ApiProperty()
  isSingleton: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class SocialLinkResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: SocialPlatform })
  platform: SocialPlatform;

  @ApiProperty()
  url: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
