import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Aumentar limite do body-parser para permitir uploads de arquivos maiores (10MB)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
  
  // Garantir que a pasta uploads/atas existe
  const uploadsAtasDir = join(__dirname, '..', 'uploads', 'atas');
  if (!fs.existsSync(uploadsAtasDir)) {
    fs.mkdirSync(uploadsAtasDir, { recursive: true });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // Escutar em todas as interfaces de rede
  console.log(`🚀 Backend rodando em http://localhost:${port}`);
  // Obter IP da rede local para exibir na mensagem
  const networkInterfaces = os.networkInterfaces();
  let localIp = 'seu-IP-local';
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    if (!addresses) continue;
    for (const addr of addresses) {
      if (
        addr.family === 'IPv4' &&
        !addr.internal &&
        addr.address.startsWith('10.1.')
      ) {
        localIp = addr.address;
        break;
      }
    }
    if (localIp !== 'seu-IP-local') break;
  }
  console.log(`🌐 Acessível na rede local: http://${localIp}:${port}`);
  console.log(
    `📱 Outros computadores na rede podem acessar em: http://${localIp}:3001`,
  );
}
void bootstrap();
