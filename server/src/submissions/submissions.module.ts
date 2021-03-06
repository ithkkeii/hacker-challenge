import { Module } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submission } from './submission.entity';
import { SubmissionsResolver } from './submissions.resolver';
import { ChallengesModule } from '../challenges/challenges.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission]),
    ChallengesModule,
    UsersModule,
  ],
  controllers: [],
  providers: [SubmissionsService, SubmissionsResolver],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
