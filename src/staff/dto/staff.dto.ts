import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { StaffStatus } from '../../common/enums';

export class CreateStaffDto {
  @ApiProperty()
  @IsString()
  fullNameEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullNameTh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  positionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  positionTh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  photoId?: string;

  @ApiPropertyOptional({ enum: StaffStatus })
  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateStaffDto extends PartialType(CreateStaffDto) {}
