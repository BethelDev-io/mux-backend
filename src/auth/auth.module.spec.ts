import { Test } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { AuthMetricsService } from './auth-metrics.service';

describe('AuthModule', () => {
  it('resolves AuthMetricsService from the compiled module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    expect(moduleRef.get(AuthMetricsService)).toBeDefined();
  });
});
