import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module.js';
import { defaultAdapters, SOURCE_ADAPTERS } from './adapters/index.js';
import { SourcesController } from './sources.controller.js';
import { SourcesService } from './sources.service.js';

@Module({
  imports: [JobsModule],
  controllers: [SourcesController],
  providers: [SourcesService, { provide: SOURCE_ADAPTERS, useFactory: defaultAdapters }],
})
export class SourcesModule {}
