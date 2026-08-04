import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublishStatus } from '@prisma/client';
import { MediaAssetResponseDto } from '../../common/dto/media-asset-response.dto';
import { UserSummaryDto } from '../../common/dto/user-response.dto';

export class ArticleCategoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nameEn: string;

  @ApiPropertyOptional({ nullable: true })
  nameTh: string | null;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  color: string | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class ArticleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  titleEn: string;

  @ApiPropertyOptional({ nullable: true })
  titleTh: string | null;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  excerptEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  excerptTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  contentEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  contentTh: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  categoryId: string | null;

  @ApiPropertyOptional({ type: ArticleCategoryResponseDto, nullable: true })
  category?: ArticleCategoryResponseDto | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  authorId: string | null;

  @ApiPropertyOptional({ type: UserSummaryDto, nullable: true })
  author?: UserSummaryDto | null;

  @ApiPropertyOptional({ nullable: true })
  authorName: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  featuredImageId: string | null;

  @ApiPropertyOptional({ type: MediaAssetResponseDto, nullable: true })
  featuredImage?: MediaAssetResponseDto | null;

  @ApiProperty({ enum: PublishStatus })
  status: PublishStatus;

  @ApiProperty()
  isVisible: boolean;

  @ApiPropertyOptional({ nullable: true })
  readTimeMinutes: number | null;

  @ApiPropertyOptional({ nullable: true })
  seoTitle: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoDescription: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
