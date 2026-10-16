import {
  ErrorDetail,
  MAX_DETAIL_MESSAGE_LENGTH,
  REDACTED_PLACEHOLDER,
  redactErrorDetails,
} from './error-envelope.dto';

describe('redactErrorDetails', () => {
  it('replaces values whose key matches the secret denylist', () => {
    const details: ErrorDetail[] = [
      { field: 'body', message: 'invalid payload', webhookSecret: 'whsec_abc123' },
    ];

    const [redacted] = redactErrorDetails(details);

    expect(redacted.webhookSecret).toBe(REDACTED_PLACEHOLDER);
    expect(redacted.field).toBe('body');
    expect(redacted.message).toBe('invalid payload');
  });

  it('masks a Stellar StrKey secret seed in a message', () => {
    const seed = 'SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const details: ErrorDetail[] = [
      { field: 'body.seed', message: `invalid seed ${seed}` },
    ];

    const [redacted] = redactErrorDetails(details);

    expect(redacted.message).not.toContain(seed);
    expect(redacted.message).toContain(REDACTED_PLACEHOLDER);
  });

  it('returns a benign detail unchanged', () => {
    const details: ErrorDetail[] = [
      { field: 'body.amount', message: 'must be positive' },
    ];

    const [redacted] = redactErrorDetails(details);

    expect(redacted).toEqual({ field: 'body.amount', message: 'must be positive' });
  });

  it('does not mutate the input array or its entries', () => {
    const details: ErrorDetail[] = [
      { field: 'body', message: 'invalid payload', token: 'jwt.token.value' },
    ];
    const snapshot = JSON.parse(JSON.stringify(details));

    const result = redactErrorDetails(details);

    expect(details).toEqual(snapshot);
    expect(result).not.toBe(details);
    expect(result[0]).not.toBe(details[0]);
  });

  it('truncates over-long messages', () => {
    const details: ErrorDetail[] = [
      { field: 'body', message: 'x'.repeat(MAX_DETAIL_MESSAGE_LENGTH + 50) },
    ];

    const [redacted] = redactErrorDetails(details);

    expect(redacted.message.length).toBeLessThanOrEqual(MAX_DETAIL_MESSAGE_LENGTH + 1);
  });
});
