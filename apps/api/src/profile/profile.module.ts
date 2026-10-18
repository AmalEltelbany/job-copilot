import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module.js';
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

@Module({ imports: [JobsModule], controllers: [ProfileController], providers: [ProfileService], exports: [ProfileService] })
export class ProfileModule {}
