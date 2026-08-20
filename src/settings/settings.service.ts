import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePreFooterHighlightDto,
  CreateSocialLinkDto,
  UpdatePreFooterHighlightDto,
  UpdateSiteSettingsDto,
  UpdateSocialLinkDto,
} from './dto/settings.dto';

/** The pre-footer CTA design has room for exactly three checklist rows. */
const MAX_PRE_FOOTER_HIGHLIGHTS = 3;

const SETTINGS_INCLUDE = {
  contactCoverImage: true,
  logo: true,
  preFooterHighlights: { orderBy: { sortOrder: 'asc' as const } },
} as const;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const existing = await this.prisma.siteSettings.findFirst({
      include: SETTINGS_INCLUDE,
    });
    if (existing) return existing;
    return this.prisma.siteSettings.create({
      data: {},
      include: SETTINGS_INCLUDE,
    });
  }

  async updateSettings(dto: UpdateSiteSettingsDto) {
    const settings = await this.getSettings();
    return this.prisma.siteSettings.update({
      where: { id: settings.id },
      data: dto,
      include: SETTINGS_INCLUDE,
    });
  }

  /** Atomically bump the public Site Visits counter (Dashboard card). */
  async incrementSiteVisits(by = 1): Promise<{ siteVisits: number }> {
    const settings = await this.getSettings();
    const updated = await this.prisma.siteSettings.update({
      where: { id: settings.id },
      data: { siteVisits: { increment: Math.max(1, by) } },
      select: { siteVisits: true },
    });
    return updated;
  }

  // --- Pre-footer CTA checklist ---
  async addPreFooterHighlight(dto: CreatePreFooterHighlightDto) {
    const settings = await this.getSettings();
    const count = await this.prisma.preFooterHighlight.count({
      where: { siteSettingsId: settings.id },
    });
    if (count >= MAX_PRE_FOOTER_HIGHLIGHTS) {
      throw new BadRequestException(
        `A maximum of ${MAX_PRE_FOOTER_HIGHLIGHTS} highlights is allowed`,
      );
    }
    return this.prisma.preFooterHighlight.create({
      data: { ...dto, siteSettingsId: settings.id },
    });
  }

  async updatePreFooterHighlight(
    id: string,
    dto: UpdatePreFooterHighlightDto,
  ) {
    await this.findPreFooterHighlight(id);
    return this.prisma.preFooterHighlight.update({ where: { id }, data: dto });
  }

  async removePreFooterHighlight(id: string) {
    await this.findPreFooterHighlight(id);
    await this.prisma.preFooterHighlight.delete({ where: { id } });
  }

  private async findPreFooterHighlight(id: string) {
    const highlight = await this.prisma.preFooterHighlight.findUnique({
      where: { id },
    });
    if (!highlight) throw new NotFoundException('Highlight not found');
    return highlight;
  }

  // --- Social links ---
  listSocialLinks() {
    return this.prisma.socialLink.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  createSocialLink(dto: CreateSocialLinkDto) {
    return this.prisma.socialLink.create({ data: dto });
  }

  async updateSocialLink(id: string, dto: UpdateSocialLinkDto) {
    const link = await this.prisma.socialLink.findUnique({ where: { id } });
    if (!link) throw new NotFoundException('Social link not found');
    return this.prisma.socialLink.update({ where: { id }, data: dto });
  }

  async removeSocialLink(id: string) {
    const link = await this.prisma.socialLink.findUnique({ where: { id } });
    if (!link) throw new NotFoundException('Social link not found');
    await this.prisma.socialLink.delete({ where: { id } });
  }
}
