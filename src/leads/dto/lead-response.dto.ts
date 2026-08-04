import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus, LeadTopic } from '@prisma/client';

export class LeadResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiPropertyOptional({ nullable: true })
  leadCode: string | null;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional({ nullable: true })
  email: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ nullable: true })
  interestCountry: string | null;

  @ApiPropertyOptional({ nullable: true })
  plannedYear: number | null;

  @ApiPropertyOptional({ nullable: true })
  duration: string | null;

  @ApiPropertyOptional({ nullable: true })
  degreeLevel: string | null;

  @ApiProperty({ enum: LeadTopic })
  topic: LeadTopic;

  @ApiProperty({ enum: LeadStatus })
  status: LeadStatus;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  submittedAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
