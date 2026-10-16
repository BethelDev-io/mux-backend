import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthMetricsService } from './auth-metrics.service';

@Module({
  imports: [PrismaModule],
  providers: [AuthMetricsService],
  exports: [AuthMetricsService],
})
export class AuthModule {}
