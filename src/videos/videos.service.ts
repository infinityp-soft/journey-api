import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '../common/crud/base-prisma.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateVideoPageDto } from './dto/video.dto';

@Injectable()
export class VideosService extends BasePrismaService {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.video, {
      include: { thumbnail: true },
      defaultOrder: { sortOrder: 'asc' },
    });
  }

  async getPageSettings() {
    const existing = await this.prisma.videoPageSettings.findFirst({
      include: { headerImage: true },
    });
    if (existing) return existing;
    return this.prisma.videoPageSettings.create({
      data: {},
      include: { headerImage: true },
    });
  }

  async updatePageSettings(dto: UpdateVideoPageDto) {
    const settings = await this.getPageSettings();
    return this.prisma.videoPageSettings.update({
      where: { id: settings.id },
      data: dto,
      include: { headerImage: true },
    });
  }
}
