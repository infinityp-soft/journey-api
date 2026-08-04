import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventFormat, EventStatus, FormFieldType } from '@prisma/client';
import { MediaAssetResponseDto } from '../../common/dto/media-asset-response.dto';

export class EventFormFieldResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  eventId: string;

  @ApiProperty()
  labelEn: string;

  @ApiPropertyOptional({ nullable: true })
  labelTh: string | null;

  @ApiProperty({ enum: FormFieldType })
  fieldType: FormFieldType;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, nullable: true })
  options: Record<string, unknown> | null;

  @ApiProperty()
  isRequired: boolean;

  @ApiProperty()
  sortOrder: number;
}

export class EventRegistrationCountDto {
  @ApiProperty()
  registrations: number;
}

export class EventListItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nameEn: string;

  @ApiPropertyOptional({ nullable: true })
  nameTh: string | null;

  @ApiProperty({ enum: EventFormat })
  format: EventFormat;

  @ApiPropertyOptional({ nullable: true })
  venueEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  venueTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  onlineUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  maxRegistrants: number | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionTh: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  coverImageId: string | null;

  @ApiPropertyOptional({ type: MediaAssetResponseDto, nullable: true })
  coverImage?: MediaAssetResponseDto | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  eventStartAt: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  eventEndAt: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  registrationOpenAt: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  registrationCloseAt: Date | null;

  @ApiProperty()
  registrationFormEnabled: boolean;

  @ApiProperty({ enum: EventStatus })
  status: EventStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ type: EventRegistrationCountDto })
  _count: EventRegistrationCountDto;
}

export class EventDetailResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nameEn: string;

  @ApiPropertyOptional({ nullable: true })
  nameTh: string | null;

  @ApiProperty({ enum: EventFormat })
  format: EventFormat;

  @ApiPropertyOptional({ nullable: true })
  venueEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  venueTh: string | null;

  @ApiPropertyOptional({ nullable: true })
  onlineUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  maxRegistrants: number | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionTh: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  coverImageId: string | null;

  @ApiPropertyOptional({ type: MediaAssetResponseDto, nullable: true })
  coverImage?: MediaAssetResponseDto | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  eventStartAt: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  eventEndAt: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  registrationOpenAt: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  registrationCloseAt: Date | null;

  @ApiProperty()
  registrationFormEnabled: boolean;

  @ApiProperty({ enum: EventStatus })
  status: EventStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ type: [EventFormFieldResponseDto] })
  formFields: EventFormFieldResponseDto[];
}

export class EventRegistrationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  eventId: string;

  @ApiProperty()
  firstName: string;

  @ApiPropertyOptional({ nullable: true })
  lastName: string | null;

  @ApiPropertyOptional({ nullable: true })
  email: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ nullable: true })
  areaOfInterest: string | null;

  @ApiProperty({ type: 'object', additionalProperties: true })
  answers: Record<string, unknown>;

  @ApiProperty({ type: String, format: 'date-time' })
  registeredAt: Date;
}
