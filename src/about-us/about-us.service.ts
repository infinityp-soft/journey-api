import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateHighlightDto,
  UpdateAboutUsDto,
  UpdateHighlightDto,
} from './dto/about-us.dto';

const MAX_HIGHLIGHTS = 3;

const ABOUT_INCLUDE = {
  teamHeaderImage: true,
  highlights: { orderBy: { sortOrder: 'asc' as const } },
} as const;

@Injectable()
export class AboutUsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile() {
    const existing = await this.prisma.aboutUs.findFirst({
      include: ABOUT_INCLUDE,
    });
    if (existing) return existing;
    return this.prisma.aboutUs.create({
      data: {},
      include: ABOUT_INCLUDE,
    });
  }

  async getPublicProfile() {
    const about = await this.getProfile();
    return {
      ...about,
      highlights: about.highlights
        .filter((highlight) => highlight.isEnabled)
        .slice(0, MAX_HIGHLIGHTS),
    };
  }

  async updateProfile(dto: UpdateAboutUsDto) {
    const about = await this.getProfile();
    return this.prisma.aboutUs.update({
      where: { id: about.id },
      data: dto,
      include: ABOUT_INCLUDE,
    });
  }

  async addHighlight(dto: CreateHighlightDto) {
    const about = await this.getProfile();
    const count = await this.prisma.aboutHighlight.count({
      where: { aboutUsId: about.id },
    });
    if (count >= MAX_HIGHLIGHTS) {
      throw new BadRequestException(
        `A maximum of ${MAX_HIGHLIGHTS} highlights is allowed`,
      );
    }
    return this.prisma.aboutHighlight.create({
      data: { ...dto, aboutUsId: about.id },
    });
  }

  async updateHighlight(id: string, dto: UpdateHighlightDto) {
    const highlight = await this.prisma.aboutHighlight.findUnique({
      where: { id },
    });
    if (!highlight) throw new NotFoundException('Highlight not found');
    return this.prisma.aboutHighlight.update({ where: { id }, data: dto });
  }

  async removeHighlight(id: string) {
    const highlight = await this.prisma.aboutHighlight.findUnique({
      where: { id },
    });
    if (!highlight) throw new NotFoundException('Highlight not found');
    await this.prisma.aboutHighlight.delete({ where: { id } });
  }
}
