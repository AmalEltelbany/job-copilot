import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module.js';
import { DemoService } from './demo.service.js';

@Module({ imports: [JobsModule], providers: [DemoService], exports: [DemoService] })
export class DemoModule {}
