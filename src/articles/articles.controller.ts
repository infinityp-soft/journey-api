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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ArticleQueryDto } from './dto/article-query.dto';
import { ApiPaginatedOkResponse } from '../common/dto/paginated-response.dto';
import { ReorderDto } from '../common/dto/reorder.dto';
import { ArticleCategoriesService } from './article-categories.service';
import { ArticlesService } from './articles.service';
import {
  CreateArticleCategoryDto,
  CreateArticleDto,
  UpdateArticleCategoryDto,
  UpdateArticleDto,
} from './dto/article.dto';
import {
  ArticleCategoryResponseDto,
  ArticleResponseDto,
} from './dto/article-response.dto';

@ApiTags('articles')
@ApiBearerAuth('access-token')
@Controller()
export class ArticlesController {
  constructor(
    private readonly articles: ArticlesService,
    private readonly categories: ArticleCategoriesService,
  ) {}

  /** Published/visible articles for the marketing website. */
  @Public()
  @Get('articles/public')
  @ApiOperation({ summary: 'List published articles (public)' })
  @ApiOkResponse({ type: [ArticleResponseDto] })
  findPublic() {
    return this.articles.findPublic();
  }

  /** Single published/visible article by slug for the marketing website. */
  @Public()
  @Get('articles/public/:slug')
  @ApiOperation({ summary: 'Get a published article by slug (public)' })
  @ApiOkResponse({ type: ArticleResponseDto })
  findPublicBySlug(@Param('slug') slug: string) {
    return this.articles.findPublicBySlug(slug);
  }

  // --- Categories (Manage Categories modal) ---
  @Post('article-categories')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Create, 'ArticleCategory'))
  @ApiOperation({ summary: 'Create an article category' })
  @ApiCreatedResponse({ type: ArticleCategoryResponseDto })
  createCategory(@Body() dto: CreateArticleCategoryDto) {
    return this.categories.create(dto);
  }

  @Get('article-categories')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'ArticleCategory'))
  @ApiOperation({ summary: 'List article categories' })
  @ApiPaginatedOkResponse(ArticleCategoryResponseDto)
  findCategories(@Query() query: PaginationQueryDto) {
    return this.categories.findAll(query);
  }

  @Patch('article-categories/reorder')
  @HttpCode(204)
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Update, 'ArticleCategory'))
  @ApiOperation({ summary: 'Reorder article categories' })
  @ApiNoContentResponse()
  async reorderCategories(@Body() dto: ReorderDto) {
    await this.categories.reorder(dto.items);
  }

  @Patch('article-categories/:id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Update, 'ArticleCategory'))
  @ApiOperation({ summary: 'Update an article category' })
  @ApiOkResponse({ type: ArticleCategoryResponseDto })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleCategoryDto,
  ) {
    return this.categories.update(id, dto);
  }

  @Delete('article-categories/:id')
  @HttpCode(204)
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Delete, 'ArticleCategory'))
  @ApiOperation({ summary: 'Delete an article category' })
  @ApiNoContentResponse()
  removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.categories.remove(id);
  }

  // --- Articles ---
  @Post('articles')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Create, 'Article'))
  @ApiOperation({ summary: 'Create an article' })
  @ApiCreatedResponse({ type: ArticleResponseDto })
  create(@Body() dto: CreateArticleDto) {
    return this.articles.create(dto);
  }

  @Get('articles')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'Article'))
  @ApiOperation({ summary: 'List articles' })
  @ApiPaginatedOkResponse(ArticleResponseDto)
  findAll(@Query() query: ArticleQueryDto) {
    return this.articles.findAll(query);
  }

  @Get('articles/:id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'Article'))
  @ApiOperation({ summary: 'Get an article by ID' })
  @ApiOkResponse({ type: ArticleResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.articles.findOne(id);
  }

  @Patch('articles/:id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Update, 'Article'))
  @ApiOperation({ summary: 'Update an article' })
  @ApiOkResponse({ type: ArticleResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articles.update(id, dto);
  }

  @Delete('articles/:id')
  @HttpCode(204)
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Delete, 'Article'))
  @ApiOperation({ summary: 'Delete an article' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.articles.remove(id);
  }
}
