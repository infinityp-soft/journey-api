import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediaAssetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  storageKey: string;

  @ApiProperty()
  originalFilename: string;

  @ApiProperty({ example: 'image/webp' })
  mimeType: string;

  @ApiProperty({ example: 102400 })
  sizeBytes: number;

  @ApiPropertyOptional({ nullable: true })
  width: number | null;

  @ApiPropertyOptional({ nullable: true })
  height: number | null;

  @ApiPropertyOptional({ nullable: true })
  altText: string | null;

  @ApiPropertyOptional({ nullable: true })
  checksumSha256: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  uploadedById: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
