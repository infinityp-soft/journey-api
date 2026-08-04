import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../common/dto/user-response.dto';

export class TokenPairResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}

export class LoginResponseDto extends TokenPairResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
