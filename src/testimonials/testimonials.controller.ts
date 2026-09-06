import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { can } from '../auth/casl/ability.decorator';
import { Action } from '../auth/casl/action.enum';
import { CheckPolicies } from '../auth/casl/policy-handler';
import { PoliciesGuard } from '../auth/casl/policies.guard';
import { Public } from '../common/decorators/public.decorator';
import { ApiPaginatedOkResponse } from '../common/dto/paginated-response.dto';
import { TestimonialQueryDto } from './dto/testimonial-query.dto';
import { ReorderDto } from '../common/dto/reorder.dto';
import {
  CreateTestimonialDto,
  UpdateTestimonialDto,
} from './dto/testimonial.dto';
import { TestimonialResponseDto } from './dto/testimonial-response.dto';
import { TestimonialsService } from './testimonials.service';

@ApiTags('testimonials')
@ApiBearerAuth('access-token')
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly service: TestimonialsService) {}

  /** Published testimonials for the marketing website. */
  @Public()
  @Get('public')
  @ApiOperation({ summary: 'List published testimonials (public)' })
  @ApiOkResponse({ type: [TestimonialResponseDto] })
  findPublic() {
    return this.service.findPublic();
  }

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Create, 'Testimonial'))
  @ApiOperation({ summary: 'Create a testimonial' })
  @ApiCreatedResponse({ type: TestimonialResponseDto })
  create(@Body() dto: CreateTestimonialDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'Testimonial'))
  @ApiOperation({ summary: 'List testimonials' })
  @ApiPaginatedOkResponse(TestimonialResponseDto)
  findAll(@Query() query: TestimonialQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'Testimonial'))
  @ApiOperation({ summary: 'Get a testimonial by ID' })
  @ApiOkResponse({ type: TestimonialResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('reorder')
  @HttpCode(204)
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Update, 'Testimonial'))
  @ApiOperation({ summary: 'Reorder testimonials' })
  @ApiNoContentResponse()
  async reorder(@Body() dto: ReorderDto) {
    await this.service.reorder(dto.items);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Update, 'Testimonial'))
  @ApiOperation({ summary: 'Update a testimonial' })
  @ApiOkResponse({ type: TestimonialResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTestimonialDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'Testimonial'))
  @ApiOperation({ summary: 'Delete a testimonial' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
