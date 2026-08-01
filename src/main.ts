import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig>);

  const apiPrefix = config.get('apiPrefix', { infer: true })!;
  app.setGlobalPrefix(apiPrefix, { exclude: ['media/(.*)'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({ origin: true, credentials: true });

  // --- Swagger / OpenAPI ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Journey Education Admin CMS API')
    .setDescription(
      'Bilingual (EN/TH) content management API for the Journey Education admin panel.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get('port', { infer: true })!;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(
    `Journey Admin CMS API running on http://localhost:${port}\n` +
      `Swagger docs at http://localhost:${port}/${apiPrefix}/docs`,
  );
}
bootstrap();
