import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { subject } from '@casl/ability';
import { Action } from '../auth/casl/action.enum';
import { can, UserAbility } from '../auth/casl/ability.decorator';
import { AppAbility, AuthUser } from '../auth/casl/casl-ability.factory';
import { CheckPolicies } from '../auth/casl/policy-handler';
import { PoliciesGuard } from '../auth/casl/policies.guard';
import { ChangePasswordDto } from '../auth/dto/auth.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiPaginatedOkResponse } from '../common/dto/paginated-response.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserResponseDto } from '../common/dto/user-response.dto';
import {
  CreateUserDto,
  UpdateProfileDto,
  UpdateUserDto,
} from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(PoliciesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @CheckPolicies(can(Action.Create, 'User'))
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({ type: UserResponseDto })
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get()
  @CheckPolicies(can(Action.Read, 'User'))
  @ApiOperation({ summary: 'List users' })
  @ApiPaginatedOkResponse(UserResponseDto)
  findAll(@Query() query: UserQueryDto) {
    return this.users.findAll(query);
  }

  /** Profile Settings — update own name / email / avatar / password. */
  @Patch('me')
  @ApiOperation({
    summary: 'Update own profile (Profile Settings modal)',
  })
  @ApiOkResponse({ type: UserResponseDto })
  updateOwnProfile(
    @CurrentUser('id') id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(id, dto);
  }

  /** Change your own password (requires current password). */
  @Patch('me/password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Change own password' })
  @ApiNoContentResponse()
  async changeOwnPassword(
    @CurrentUser('id') id: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.users.changePassword(id, dto.currentPassword, dto.newPassword);
  }

  @Get(':id')
  @CheckPolicies(can(Action.Read, 'User'))
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiOkResponse({ type: UserResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @UserAbility() ability: AppAbility,
    @CurrentUser() current: AuthUser,
  ) {
    const target = subject('User', { id });
    if (!ability.can(Action.Update, target)) {
      throw new ForbiddenException('Cannot update this user');
    }
    if (current.role !== 'admin') delete (dto as { role?: unknown }).role;
    return this.users.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'User'))
  @ApiOperation({ summary: 'Delete a user' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.remove(id);
  }
}
