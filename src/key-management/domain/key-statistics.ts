import { KeyOperation } from './key-types';
import { KeyManagementErrorCode } from './key-management.errors';

/**
 * Parameters for querying key statistics.
 */
export interface StatisticsQueryParams {
  /** Start date (ISO string) */
  startDate?: string;

  /** End date (ISO string) */
  endDate?: string;

  /** Filter by operation type */
  operation?: KeyOperation;

  /** Whether to include time series data */
  includeTimeSeries?: boolean;
}

/**
 * Error thrown when statistics query params are invalid.
 */
export class InvalidStatisticsQueryError extends Error {
  readonly errorCode = KeyManagementErrorCode.INVALID_INPUT;

  constructor(message: string) {
    super(message);
    this.name = 'InvalidStatisticsQueryError';
  }
}

/**
 * Validates and normalizes statistics query params.
 *
 * Rejects unparseable ISO dates, inverted ranges, and operation values
 * outside the KeyOperation enum. Returns the parsed bounds so callers can
 * guarantee periodStart/periodEnd match the requested range.
 */
export function validateStatisticsQueryParams(params: StatisticsQueryParams): {
  startDate?: Date;
  endDate?: Date;
} {
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (params.startDate !== undefined) {
    startDate = new Date(params.startDate);
    if (Number.isNaN(startDate.getTime())) {
      throw new InvalidStatisticsQueryError(
        `Invalid startDate: ${params.startDate}`,
      );
    }
  }

  if (params.endDate !== undefined) {
    endDate = new Date(params.endDate);
    if (Number.isNaN(endDate.getTime())) {
      throw new InvalidStatisticsQueryError(
        `Invalid endDate: ${params.endDate}`,
      );
    }
  }

  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    throw new InvalidStatisticsQueryError(
      'startDate must not be after endDate',
    );
  }

  if (
    params.operation !== undefined &&
    !Object.values(KeyOperation).includes(params.operation)
  ) {
    throw new InvalidStatisticsQueryError(
      `Invalid operation: ${params.operation}`,
    );
  }

  return { startDate, endDate };
}

/**
 * Aggregated statistics for key operations over a period.
 */
export interface KeyStatistics {
  /** Total number of operations */
  totalOperations: number;

  /** Number of successful operations */
  successfulOperations: number;

  /** Number of failed operations */
  failedOperations: number;

  /** ISO timestamp of the start of the period */
  periodStart: string;

  /** ISO timestamp of the end of the period */
  periodEnd: string;
}

/**
 * Per-operation metrics.
 */
export interface OperationMetrics {
  /** The operation type */
  operation: KeyOperation;

  /** Total number of operations */
  total: number;

  /** Number of successful operations */
  successful: number;

  /** Number of failed operations */
  failed: number;
}

/**
 * Detailed statistics including per-operation metrics and recent operations.
 */
export interface DetailedKeyStatistics extends KeyStatistics {
  /** Per-operation metrics */
  operationMetrics: OperationMetrics[];

  /** Recent operations */
  recentOperations: unknown[];

  /** Optional time series data */
  timeSeries?: unknown[];
}
