import { UserRole } from '../common/enums';

/** Shape of the signed access-token payload. */
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
}

/** Shape of the signed refresh-token payload. */
export interface RefreshPayload {
  sub: string;
  jti: string; // token id, matched against refresh_tokens
}
