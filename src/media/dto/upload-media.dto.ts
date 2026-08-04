import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadMediaDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file (jpg, png, or webp)',
  })
  file: Express.Multer.File;

  @ApiPropertyOptional({
    example: 'Hero banner background',
    description: 'Optional alt text for accessibility',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string;
}
