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

  /**
   * In-memory counter registry so exported values can be scraped/asserted.
   * Keyed by the sanitized metric name (which may include bounded labels).
   */
  private readonly counters = new Map<string, number>();

  /**
   * Increment a named counter by the given amount.
   * Labels are sanitized to be log-safe.
   */
  incrementCounter(name: string, value: number = 1): void {
    const safeName = this.sanitizeLabel(name);
    this.counters.set(safeName, (this.counters.get(safeName) ?? 0) + value);
    this.logger.debug(`counter_inc ${safeName}=${value}`);
  }

  /**
   * Read the current value of a counter (0 when never incremented).
   */
  getCounter(name: string): number {
    return this.counters.get(this.sanitizeLabel(name)) ?? 0;
  }

  /**
   * Snapshot of all counters, suitable for a scrape/export path.
   */
  getCounters(): Record<string, number> {
    return Object.fromEntries(this.counters);
  }

  /**
   * Record a histogram observation.
   */
  recordHistogram(name: string, value: number): void {
    const metricName = this.sanitizeLabel(name);
    this.logger.debug(`histogram ${metricName} = ${value}`);
  }
}
