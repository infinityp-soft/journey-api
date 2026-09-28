import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponseDto } from '../common/dto/user-response.dto';
import { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UpdateProfileDto } from '../users/dto/user.dto';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { AuthUser } from './casl/casl-ability.factory';
import {
  LoginResponseDto,
  TokenPairResponseDto,
} from './dto/auth-response.dto';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  ResetPasswordDto,
  VerifyResetTokenDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ type: LoginResponseDto })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto.email, dto.password, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({ type: TokenPairResponseDto })
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiNoContentResponse()
  async logout(@Body() dto: RefreshDto) {
    await this.auth.logout(dto.refreshToken);
  }

  /** Current user profile (header avatar / Profile Settings). */
  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  me(@CurrentUser() user: AuthUser) {
    return this.users.findOne(user.id);
  }

  /** Profile Settings modal — update own details (alias of PATCH /users/me). */
  @ApiBearerAuth('access-token')
  @Patch('me')
  @ApiOperation({ summary: 'Update own profile (Profile Settings)' })
  @ApiOkResponse({ type: UserResponseDto })
  updateMe(@CurrentUser('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(id, dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiOkResponse({ description: 'Generic success message' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email, dto.locale);
  }

  @Public()
  @Get('verify-reset-token')
  @ApiOperation({ summary: 'Verify if a reset token is valid' })
  @ApiOkResponse({ description: 'Token validity status' })
  verifyResetToken(@Query() query: VerifyResetTokenDto) {
    return this.auth.verifyResetToken(query.token);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiOkResponse({ description: 'Password reset status' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword);
  }
}
