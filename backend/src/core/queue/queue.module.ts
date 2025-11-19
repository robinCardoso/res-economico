import { Module, Global, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('QueueModule');
        const host = configService.get('REDIS_HOST', 'localhost');
        const port = configService.get('REDIS_PORT', 6379);
        
        logger.log(`Configurando Bull com Redis: ${host}:${port}`);
        
        // Configuração para Bull (compatível com BullMQ via Redis)
        const config = {
          redis: {
            host,
            port: Number(port),
            retryStrategy: (times: number) => {
              const delay = Math.min(times * 50, 2000);
              logger.warn(`Tentativa de reconexão ao Redis (${times}): aguardando ${delay}ms`);
              return delay;
            },
            maxRetriesPerRequest: 3,
          },
        };
        
        logger.log(`Configuração do Bull: ${JSON.stringify(config)}`);
        return config;
      },
      inject: [ConfigService],
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}

