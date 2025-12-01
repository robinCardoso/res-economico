import { Module } from '@nestjs/common';
import { AtasController } from './atas.controller';
import { AtasService } from './atas.service';
import { CoreModule } from '../core/core.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [CoreModule, ConfigModule],
  controllers: [AtasController],
  providers: [AtasService],
  exports: [AtasService],
})
export class AtasModule {}

