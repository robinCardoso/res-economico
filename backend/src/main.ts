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
  // Permitir localhost e IPs da rede local (10.1.x.x, 192.168.x.x, 172.x.x.x)
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      /^http:\/\/10\.1\.\d+\.\d+:3001$/, // Permite qualquer IP 10.1.x.x:3001
      /^http:\/\/10\.1\.\d+\.\d+:3000$/, // Permite qualquer IP 10.1.x.x:3000
      /^http:\/\/192\.168\.\d+\.\d+:3001$/, // Permite qualquer IP 192.168.x.x:3001
      /^http:\/\/192\.168\.\d+\.\d+:3000$/, // Permite qualquer IP 192.168.x.x:3000
      /^http:\/\/172\.\d+\.\d+\.\d+:3001$/, // Permite qualquer IP 172.x.x.x:3001 (redes privadas)
      /^http:\/\/172\.\d+\.\d+\.\d+:3000$/, // Permite qualquer IP 172.x.x.x:3000 (redes privadas)
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

  // Obter IPs da rede local para exibir na mensagem
  const networkInterfaces = os.networkInterfaces();
  const localIps: string[] = [];
  let primaryIp = 'seu-IP-local';

  // Coletar todos os IPs válidos
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    if (!addresses) continue;
    for (const addr of addresses) {
      // Type guard para garantir que addr.family é 'IPv4' ou 'IPv6'
      if (addr.family !== 'IPv4' && addr.family !== 'IPv6') continue;
      if (
        addr.family === 'IPv4' &&
        !addr.internal &&
        (addr.address.startsWith('10.1.') ||
          addr.address.startsWith('192.168.') ||
          addr.address.startsWith('172.'))
      ) {
        localIps.push(addr.address);
        // Priorizar IPs da rede 10.1.x.x (rede principal/compartilhada)
        if (primaryIp === 'seu-IP-local') {
          primaryIp = addr.address;
        } else if (addr.address.startsWith('10.1.')) {
          // Priorizar rede 10.1.x.x sobre outras
          primaryIp = addr.address;
        } else if (
          addr.address.startsWith('192.168.') &&
          !primaryIp.startsWith('10.1.')
        ) {
          // Se não tem 10.1.x.x, usar 192.168.x.x
          if (!primaryIp.startsWith('192.168.')) {
            primaryIp = addr.address;
          }
        } else if (
          addr.address.startsWith('172.') &&
          !primaryIp.startsWith('10.1.') &&
          !primaryIp.startsWith('192.168.')
        ) {
          // 172.x.x.x como última opção
          if (!primaryIp.startsWith('172.')) {
            primaryIp = addr.address;
          }
        }
      }
    }
  }

  // Exibir IPs detectados
  if (localIps.length > 0) {
    console.log(`🌐 Acessível na rede local: http://${primaryIp}:${port}`);
    if (localIps.length > 1) {
      console.log(`📋 Todos os IPs detectados:`);
      localIps.forEach((ip) => {
        const isPrimary = ip === primaryIp ? ' (principal)' : '';
        console.log(`   - http://${ip}:${port}${isPrimary}`);
      });
    }
    console.log(
      `📱 Outros computadores na rede podem acessar o frontend em: http://${primaryIp}:3001`,
    );
    console.log(
      `💡 Configure NEXT_PUBLIC_API_URL=http://${primaryIp}:${port} no arquivo frontend/.env.local`,
    );
  } else {
    console.log(
      `⚠️  Nenhum IP de rede local detectado. Verifique sua conexão de rede.`,
    );
  }
}
void bootstrap();
