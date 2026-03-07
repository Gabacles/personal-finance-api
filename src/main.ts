import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Teach JSON.stringify to handle Prisma BigInt fields (money as integer cents).
// All cent values are well within Number.MAX_SAFE_INTEGER so Number conversion is safe.
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function (
  this: bigint,
) {
  return Number(this);
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe — fail fast, strip unknown properties
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Personal Finance API')
    .setDescription(
      'A monthly cash-flow management API for the Brazilian financial context.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'jwt',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/api/v1`);
  console.log(
    `Swagger docs available at: http://localhost:${port}/api/docs`,
  );
}

bootstrap();

