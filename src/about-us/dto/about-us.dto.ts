import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdateAboutUsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyTitleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyTitleTh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bioEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bioTh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teamPageTitleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teamPageTitleTh?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  teamHeaderImageId?: string;
}

export class CreateHighlightDto {
  @ApiProperty({ example: 'Certified Experts' })
  @IsString()
  titleEn: string;

  @ApiPropertyOptional({ example: 'ผู้เชี่ยวชาญที่ได้รับการรับรอง' })
  @IsOptional()
  @IsString()
  titleTh?: string;

  @ApiPropertyOptional({
    description: 'Short description (EN)',
    example: 'Over 200 accredited consultants globally.',
  })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({
    description: 'Short description (TH)',
    example: 'ที่ปรึกษาที่ได้รับการรับรองกว่า 200 คนทั่วโลก',
  })
  @IsOptional()
  @IsString()
  descriptionTh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateHighlightDto extends PartialType(CreateHighlightDto) {}
