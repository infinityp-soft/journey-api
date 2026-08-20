import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { SocialPlatform } from '../../common/enums';

export class UpdateSiteSettingsDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contactCoverImageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactTitleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactTitleTh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressTh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  inquiryEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleMapLink?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  logoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  footerBioEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  footerBioTh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultSeoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultSeoDescription?: string;

  @ApiPropertyOptional({
    description: 'Dashboard Site Visits counter (admin override)',
    example: 42500,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  siteVisits?: number;

  // --- Pre-footer CTA band ---
  @ApiPropertyOptional({ description: 'Show the pre-footer CTA on the site' })
  @IsOptional()
  @IsBoolean()
  preFooterEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preFooterTitleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preFooterTitleTh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preFooterDescriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preFooterDescriptionTh?: string;

  @ApiPropertyOptional({
    enum: SocialPlatform,
    description: 'Channel the CTA button points at, e.g. line',
  })
  @IsOptional()
  @IsEnum(SocialPlatform)
  preFooterCtaPlatform?: SocialPlatform;

  @ApiPropertyOptional({ example: 'Add us on LINE' })
  @IsOptional()
  @IsString()
  preFooterCtaLabelEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preFooterCtaLabelTh?: string;

  @ApiPropertyOptional({ example: 'https://line.me/R/ti/p/@journey' })
  @IsOptional()
  @IsString()
  preFooterCtaUrl?: string;
}

export class CreatePreFooterHighlightDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textTh?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdatePreFooterHighlightDto extends PartialType(
  CreatePreFooterHighlightDto,
) {}

export class CreateSocialLinkDto {
  @ApiProperty({ enum: SocialPlatform })
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateSocialLinkDto extends PartialType(CreateSocialLinkDto) {}
