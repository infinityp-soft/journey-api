import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { SimpleStatus } from '../../common/enums';

export class VisaDocumentDto {
  @ApiProperty()
  @IsString()
  labelEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  labelTh?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateVisaServiceDto {
  @ApiProperty()
  @IsString()
  titleEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleTh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionHtmlEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionHtmlTh?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  headerImageId?: string;

  @ApiPropertyOptional({ enum: SimpleStatus })
  @IsOptional()
  @IsEnum(SimpleStatus)
  status?: SimpleStatus;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ type: [VisaDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VisaDocumentDto)
  documents?: VisaDocumentDto[];
}

export class UpdateVisaServiceDto extends PartialType(CreateVisaServiceDto) {}
