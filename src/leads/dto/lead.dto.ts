import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { LeadStatus, LeadTopic } from '../../common/enums';

export class CreateLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadCode?: string;

  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interestCountry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  plannedYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  degreeLevel?: string;

  @ApiPropertyOptional({ enum: LeadTopic })
  @IsOptional()
  @IsEnum(LeadTopic)
  topic?: LeadTopic;

  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeadDto extends PartialType(CreateLeadDto) {}
