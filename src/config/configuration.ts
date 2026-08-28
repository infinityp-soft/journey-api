export interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  /** Max JSON/urlencoded body size in MB (HTML content from rich-text editors). */
  jsonBodyLimitMb: number;
  databaseUrl: string;
  jwt: {
    accessSecret: string;
    accessTtl: string;
    refreshSecret: string;
    refreshTtl: string;
  };
  media: {
    uploadDir: string;
    publicUrl: string;
    maxUploadMb: number;
  };
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  jsonBodyLimitMb: parseInt(process.env.JSON_BODY_LIMIT_MB ?? '10', 10),
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgresql://journey:secret@localhost:5432/journey?schema=public',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  media: {
    uploadDir: process.env.UPLOAD_DIR ?? './storage/uploads',
    publicUrl: process.env.PUBLIC_MEDIA_URL ?? 'http://localhost:3000/media',
    maxUploadMb: parseInt(process.env.MAX_UPLOAD_MB ?? '5', 10),
  },
});
