import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationPipe} from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://asistente-personal.netlify.app']
        : [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:3001',
            'http://localhost:4173',
            'http://192.168.100.23:3000',
            'https://asistente-personal.netlify.app'
          ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // 24 horas
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
