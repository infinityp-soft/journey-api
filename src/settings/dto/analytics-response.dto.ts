import { ApiProperty } from '@nestjs/swagger';

export class SiteVisitsResponseDto {
  @ApiProperty({ example: 1250 })
  siteVisits: number;
}
