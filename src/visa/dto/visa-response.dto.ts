import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SimpleStatus } from '@prisma/client';
import { MediaAssetResponseDto } from '../../common/dto/media-asset-response.dto';

export class VisaDocumentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  visaServiceId: string;

  @ApiProperty()
  labelEn: string;

  @ApiPropertyOptional({ nullable: true })
  labelTh: string | null;

  @ApiProperty()
  sortOrder: number;
}

export class VisaServiceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  titleEn: string;

  @ApiPropertyOptional({ nullable: true })
  titleTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  country: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionHtmlEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionHtmlTh: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  headerImageId: string | null;

  @ApiPropertyOptional({ type: MediaAssetResponseDto, nullable: true })
  headerImage?: MediaAssetResponseDto | null;

  @ApiProperty({ enum: SimpleStatus })
  status: SimpleStatus;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ type: [VisaDocumentResponseDto] })
  documents: VisaDocumentResponseDto[];
}
