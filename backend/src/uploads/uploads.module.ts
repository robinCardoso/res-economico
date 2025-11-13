import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { ExcelProcessorService } from './excel-processor.service';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  providers: [UploadsService, ExcelProcessorService],
  controllers: [UploadsController],
  exports: [UploadsService, ExcelProcessorService],
})
export class UploadsModule {}
