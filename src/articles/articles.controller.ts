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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { can } from '../auth/casl/ability.decorator';
import { Action } from '../auth/casl/action.enum';
import { CheckPolicies } from '../auth/casl/policy-handler';
import { PoliciesGuard } from '../auth/casl/policies.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ReorderDto } from '../common/dto/reorder.dto';
import { ArticleCategoriesService } from './article-categories.service';
import { ArticlesService } from './articles.service';
import {
  CreateArticleCategoryDto,
  CreateArticleDto,
  UpdateArticleCategoryDto,
  UpdateArticleDto,
} from './dto/article.dto';

@ApiTags('articles')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(PoliciesGuard)
export class ArticlesController {
  constructor(
    private readonly articles: ArticlesService,
    private readonly categories: ArticleCategoriesService,
  ) {}

  // --- Categories (Manage Categories modal) ---
  @Post('article-categories')
  @CheckPolicies(can(Action.Create, 'ArticleCategory'))
  @ApiOperation({ summary: 'Create an article category' })
  createCategory(@Body() dto: CreateArticleCategoryDto) {
    return this.categories.create(dto);
  }

  @Get('article-categories')
  @CheckPolicies(can(Action.Read, 'ArticleCategory'))
  @ApiOperation({ summary: 'List article categories' })
  findCategories(@Query() query: PaginationQueryDto) {
    return this.categories.findAll(query);
  }

  @Patch('article-categories/reorder')
  @HttpCode(204)
  @CheckPolicies(can(Action.Update, 'ArticleCategory'))
  @ApiOperation({ summary: 'Reorder article categories' })
  async reorderCategories(@Body() dto: ReorderDto) {
    await this.categories.reorder(dto.items);
  }

  @Patch('article-categories/:id')
  @CheckPolicies(can(Action.Update, 'ArticleCategory'))
  @ApiOperation({ summary: 'Update an article category' })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleCategoryDto,
  ) {
    return this.categories.update(id, dto);
  }

  @Delete('article-categories/:id')
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'ArticleCategory'))
  @ApiOperation({ summary: 'Delete an article category' })
  removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.categories.remove(id);
  }

  // --- Articles ---
  @Post('articles')
  @CheckPolicies(can(Action.Create, 'Article'))
  @ApiOperation({ summary: 'Create an article' })
  create(@Body() dto: CreateArticleDto) {
    return this.articles.create(dto);
  }

  @Get('articles')
  @CheckPolicies(can(Action.Read, 'Article'))
  @ApiOperation({ summary: 'List articles' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.articles.findAll(query);
  }

  @Get('articles/:id')
  @CheckPolicies(can(Action.Read, 'Article'))
  @ApiOperation({ summary: 'Get an article by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.articles.findOne(id);
  }

  @Patch('articles/:id')
  @CheckPolicies(can(Action.Update, 'Article'))
  @ApiOperation({ summary: 'Update an article' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articles.update(id, dto);
  }

  @Delete('articles/:id')
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'Article'))
  @ApiOperation({ summary: 'Delete an article' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.articles.remove(id);
  }
}
