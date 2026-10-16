import { Test, TestingModule } from '@nestjs/testing';
import { AuthMetricsService } from './auth-metrics.service';

describe('AuthMetricsService', () => {
  let service: AuthMetricsService;
  let debugSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthMetricsService],
    }).compile();

    service = module.get<AuthMetricsService>(AuthMetricsService);
    debugSpy = jest
      .spyOn((service as any).logger, 'debug')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('emits the outcome log line for recordAttemptOutcome', () => {
    service.recordAttemptOutcome('success', 42);

    expect(debugSpy).toHaveBeenCalledWith(
      'auth_attempt outcome=success latency=42ms',
    );
  });

  it('emits the result log line for recordAttemptResult', () => {
    service.recordAttemptResult('clerk', true);

    expect(debugSpy).toHaveBeenCalledWith(
      'auth_attempt provider=clerk success=true',
    );
  });
});
