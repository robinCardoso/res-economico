import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { CoreModule } from '../../core/core.module';

@Module({
  imports: [CoreModule],
  providers: [TemplatesService],
  controllers: [TemplatesController],
  exports: [TemplatesService],
})
export class TemplatesModule {}
