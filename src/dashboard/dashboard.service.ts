import { Injectable } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Shape the Dashboard screen expects for the activity table. */
function mapActivity(row: {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  summary: string | null;
  createdAt: Date;
  user: { id: string; name: string; email: string; role: string } | null;
}) {
  return {
    id: row.id,
    user: row.user
      ? {
          id: row.user.id,
          name: row.user.name,
          email: row.user.email,
          role: row.user.role,
        }
      : null,
    action: row.action,
    /** Combined Action/Menu label shown in the dashboard table. */
    menu: row.summary ?? row.entityType ?? row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    summary: row.summary,
    createdAt: row.createdAt,
  };
}

function mapArticle(row: {
  id: string;
  titleEn: string;
  titleTh: string | null;
  slug: string;
  status: PublishStatus;
  publishedAt: Date | null;
  createdAt: Date;
  category: {
    id: string;
    nameEn: string;
    nameTh: string | null;
    slug: string;
    color: string | null;
  } | null;
}) {
  return {
    id: row.id,
    titleEn: row.titleEn,
    titleTh: row.titleTh,
    slug: row.slug,
    status: row.status,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    category: row.category
      ? {
          id: row.category.id,
          nameEn: row.category.nameEn,
          nameTh: row.category.nameTh,
          slug: row.category.slug,
          color: row.category.color,
        }
      : null,
  };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dashboard summary matching Stitch screens:
   *   - Total Leads / Site Visits / Total Articles / Total Destinations
   *   - User Activity Log
   *   - Recent Blog Activities
   */
  async summary() {
    const settings = await this.prisma.siteSettings.findFirst();

    const [
      totalLeads,
      totalArticles,
      totalDestinations,
      recentActivity,
      recentArticles,
    ] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.article.count(),
      this.prisma.destination.count(),
      this.prisma.activityLog.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.article.findMany({
        where: { isVisible: true },
        include: {
          category: {
            select: {
              id: true,
              nameEn: true,
              nameTh: true,
              slug: true,
              color: true,
            },
          },
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: 5,
      }),
    ]);

    return {
      stats: {
        totalLeads,
        siteVisits: settings?.siteVisits ?? 0,
        totalArticles,
        totalDestinations,
      },
      recentActivity: recentActivity.map(mapActivity),
      recentArticles: recentArticles.map(mapArticle),
    };
  }
}
