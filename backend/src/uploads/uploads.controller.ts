import { Controller, Get, Param } from '@nestjs/common';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get()
  list() {
    return this.uploadsService.findAll();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.uploadsService.findOne(id);
  }
}
