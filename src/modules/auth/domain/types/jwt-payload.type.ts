export interface JwtAccessPayload {
  sub: string;
  email: string;
  roles: string[];
}

export interface JwtRefreshPayload {
  sub: string;
  jti: string;
  tokenType: 'refresh';
}
