import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;
}

export class VerifyResetTokenDto {
  @ApiProperty({ description: 'Raw reset token sent via email' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Raw reset token sent via email' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ minLength: 8, example: 'NewSecret123!' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
