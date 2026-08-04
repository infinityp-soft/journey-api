import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublishStatus } from '@prisma/client';
import { UserSummaryDto } from '../../common/dto/user-response.dto';

export class DashboardStatsDto {
  @ApiProperty()
  totalLeads: number;

  @ApiProperty()
  siteVisits: number;

  @ApiProperty()
  totalArticles: number;

  @ApiProperty()
  totalDestinations: number;
}

export class DashboardActivityItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiPropertyOptional({ type: UserSummaryDto, nullable: true })
  user: UserSummaryDto | null;

  @ApiProperty()
  action: string;

  @ApiProperty({ description: 'Combined Action/Menu label for the dashboard table' })
  menu: string;

  @ApiPropertyOptional({ nullable: true })
  entityType: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  entityId: string | null;

  @ApiPropertyOptional({ nullable: true })
  summary: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class DashboardArticleCategoryDto {
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
}

export class DashboardRecentArticleDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  titleEn: string;

  @ApiPropertyOptional({ nullable: true })
  titleTh: string | null;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: PublishStatus })
  status: PublishStatus;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiPropertyOptional({ type: DashboardArticleCategoryDto, nullable: true })
  category: DashboardArticleCategoryDto | null;
}

export class DashboardSummaryResponseDto {
  @ApiProperty({ type: DashboardStatsDto })
  stats: DashboardStatsDto;

  @ApiProperty({ type: [DashboardActivityItemDto] })
  recentActivity: DashboardActivityItemDto[];

  @ApiProperty({ type: [DashboardRecentArticleDto] })
  recentArticles: DashboardRecentArticleDto[];
}
