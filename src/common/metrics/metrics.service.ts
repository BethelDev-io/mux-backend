import { Injectable, Logger } from '@nestjs/common';

/**
 * Maximum length of a sanitized metric name.
 *
 * Metric names are frequently built by interpolating caller-controlled values
 * (wallet ids, transaction hashes, request paths). The character sanitizer
 * constrains the alphabet but not the length, so an unbounded value could push
 * a large amount of caller-controlled data into the debug log. Names are
 * therefore truncated deterministically to this length after sanitization.
 */
export const MAX_METRIC_NAME_LENGTH = 200;

/**
 * Emits counters and histograms for observability without leaking secrets, raw
 * key material, or PII. All metric labels are constrained to a safe character
 * set and bounded in length before they are logged.
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private hasWarnedAboutTruncation = false;

  /**
   * Sanitizes a metric label so it is safe to use as a metric name.
   *
   * Illegal characters are replaced with `_` and the result is truncated to
   * {@link MAX_METRIC_NAME_LENGTH} characters. Truncation is deterministic
   * (a simple prefix) and a one-time warning is logged the first time it
   * happens.
   */
  sanitizeLabel(label: string): string {
    const sanitized = label.replace(/[^A-Za-z0-9_:.-]/g, '_');

    if (sanitized.length <= MAX_METRIC_NAME_LENGTH) {
      return sanitized;
    }

    if (!this.hasWarnedAboutTruncation) {
      this.hasWarnedAboutTruncation = true;
      this.logger.warn(
        `Metric name exceeded ${MAX_METRIC_NAME_LENGTH} characters and was truncated`,
      );
    }

    return sanitized.slice(0, MAX_METRIC_NAME_LENGTH);
  }

  incrementCounter(name: string, value = 1): void {
    const metricName = this.sanitizeLabel(name);
    this.logger.debug(`counter ${metricName} += ${value}`);
  }

  recordHistogram(name: string, value: number): void {
    const metricName = this.sanitizeLabel(name);
    this.logger.debug(`histogram ${metricName} = ${value}`);
  }
}
