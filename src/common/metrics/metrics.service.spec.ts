import { MAX_METRIC_NAME_LENGTH, MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  describe('sanitizeLabel', () => {
    it('replaces illegal characters with underscores', () => {
      expect(service.sanitizeLabel('wallet id/with spaces')).toBe(
        'wallet_id_with_spaces',
      );
    });

    it('replaces spaces, quotes, newlines and unicode with underscores', () => {
      const sanitized = service.sanitizeLabel(
        'a b"c\nd\u00e9\u4e2d\u6587',
      );

      expect(sanitized).toMatch(/^[A-Za-z0-9_:.-]+$/);
      expect(sanitized).toBe('a_b_c_d___');
    });

    it('truncates a 5000-character input to exactly MAX_METRIC_NAME_LENGTH', () => {
      const sanitized = service.sanitizeLabel('a'.repeat(5000));

      expect(sanitized).toHaveLength(MAX_METRIC_NAME_LENGTH);
    });

    it('keeps the truncated name within the safe character set', () => {
      const sanitized = service.sanitizeLabel('a b'.repeat(2000));

      expect(sanitized).toHaveLength(MAX_METRIC_NAME_LENGTH);
      expect(sanitized).toMatch(/^[A-Za-z0-9_:.-]+$/);
    });

    it('does not truncate names at or below the maximum length', () => {
      const name = 'a'.repeat(MAX_METRIC_NAME_LENGTH);

      expect(service.sanitizeLabel(name)).toBe(name);
    });
  });

  describe('incrementCounter', () => {
    it('does not throw for illegal characters', () => {
      expect(() => service.incrementCounter('wallet id/with spaces')).not.toThrow();
    });

    it('does not throw for a 5000-character input', () => {
      expect(() => service.incrementCounter('a'.repeat(5000))).not.toThrow();
    });

    it('does not throw for spaces, quotes, newlines and unicode', () => {
      expect(() =>
        service.incrementCounter('a b"c\nd\u00e9\u4e2d\u6587'),
      ).not.toThrow();
    });
  });

  describe('recordHistogram', () => {
    it('does not throw for illegal characters', () => {
      expect(() =>
        service.recordHistogram('wallet id/with spaces', 1),
      ).not.toThrow();
    });

    it('does not throw for a 5000-character input', () => {
      expect(() => service.recordHistogram('a'.repeat(5000), 1)).not.toThrow();
    });

    it('does not throw for spaces, quotes, newlines and unicode', () => {
      expect(() =>
        service.recordHistogram('a b"c\nd\u00e9\u4e2d\u6587', 1),
      ).not.toThrow();
    });
  });
});
