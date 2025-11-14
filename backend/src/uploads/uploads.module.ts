import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { ExcelProcessorService } from './excel-processor.service';
import { UploadProcessor } from './processors/upload.processor';
import { CoreModule } from '../core/core.module';
import { QueueModule } from '../core/queue/queue.module';

@Module({
  imports: [
    CoreModule,
    QueueModule,
    BullModule.registerQueue({
      name: 'upload-processing',
    }),
  ],
  providers: [UploadsService, ExcelProcessorService, UploadProcessor],
  controllers: [UploadsController],
  exports: [UploadsService, ExcelProcessorService],
})
export class UploadsModule {}
