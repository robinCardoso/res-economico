import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Habilitar validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Habilitar CORS
  // Permitir localhost e IPs da rede local (10.1.x.x)
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      /^http:\/\/10\.1\.\d+\.\d+:3001$/, // Permite qualquer IP 10.1.x.x:3001
      /^http:\/\/10\.1\.\d+\.\d+:3000$/, // Permite qualquer IP 10.1.x.x:3000
    ],
    credentials: true,
  });

  // Servir arquivos estáticos da pasta uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // Escutar em todas as interfaces de rede
  console.log(
    `🚀 Backend rodando em http://localhost:${port}`,
  );
  console.log(
    `🌐 Acessível na rede local via IP: http://<SEU_IP>:${port}`,
  );
}
void bootstrap();
