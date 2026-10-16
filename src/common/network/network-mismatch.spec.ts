import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  NetworkErrorCode,
  ScopedNetwork,
  assertNetworkMatch,
  networksMatch,
  normalizeNetwork,
} from './network-mismatch';

describe('normalizeNetwork', () => {
  it('normalizes lowercase testnet', () => {
    expect(normalizeNetwork('testnet')).toBe(ScopedNetwork.TESTNET);
  });

  it('trims and uppercases a padded mainnet value', () => {
    expect(normalizeNetwork(' MAINNET ')).toBe(ScopedNetwork.MAINNET);
  });

  it('normalizes lowercase mainnet', () => {
    expect(normalizeNetwork('mainnet')).toBe(ScopedNetwork.MAINNET);
  });

  it('normalizes devnet', () => {
    expect(normalizeNetwork('devnet')).toBe(ScopedNetwork.DEVNET);
  });

  it('returns null for an empty string', () => {
    expect(normalizeNetwork('')).toBeNull();
  });

  it('returns null for null', () => {
    expect(normalizeNetwork(null)).toBeNull();
  });

  it('returns null for a number', () => {
    expect(normalizeNetwork(42)).toBeNull();
  });

  it('returns null for an object', () => {
    expect(normalizeNetwork({})).toBeNull();
  });
});

describe('networksMatch', () => {
  it('returns true when the scope is null regardless of the requested value', () => {
    expect(networksMatch(null, 'MAINNET')).toBe(true);
    expect(networksMatch(null, null)).toBe(true);
    expect(networksMatch(null, 'anything')).toBe(true);
  });

  it('returns false for a null requested value under a scoped credential', () => {
    expect(networksMatch(ScopedNetwork.TESTNET, null)).toBe(false);
  });

  it('returns true when the requested value matches the scope', () => {
    expect(networksMatch(ScopedNetwork.TESTNET, 'TESTNET')).toBe(true);
  });

  it('returns false when the requested value differs from the scope', () => {
    expect(networksMatch(ScopedNetwork.TESTNET, 'MAINNET')).toBe(false);
  });
});

describe('assertNetworkMatch', () => {
  it('does not throw for an unscoped credential', () => {
    expect(() => assertNetworkMatch(null, 'MAINNET')).not.toThrow();
  });

  it('throws ForbiddenException with NETWORK_MISMATCH for a mismatched scope', () => {
    try {
      assertNetworkMatch(ScopedNetwork.TESTNET, 'MAINNET');
      fail('expected assertNetworkMatch to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      const response = (error as ForbiddenException).getResponse() as {
        code: string;
      };
      expect(response.code).toBe(NetworkErrorCode.NETWORK_MISMATCH);
    }
  });

  it('throws BadRequestException with INVALID_NETWORK for an unparseable requested value', () => {
    try {
      assertNetworkMatch(ScopedNetwork.TESTNET, 'not-a-network');
      fail('expected assertNetworkMatch to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        code: string;
      };
      expect(response.code).toBe(NetworkErrorCode.INVALID_NETWORK);
    }
  });

  it('echoes a caller-supplied correlationId in the thrown response', () => {
    const correlationId = 'corr-123';
    try {
      assertNetworkMatch(ScopedNetwork.TESTNET, 'MAINNET', correlationId);
      fail('expected assertNetworkMatch to throw');
    } catch (error) {
      const response = (error as ForbiddenException).getResponse() as {
        correlationId: string;
      };
      expect(response.correlationId).toBe(correlationId);
    }
  });

  it('generates a correlationId when none is supplied', () => {
    try {
      assertNetworkMatch(ScopedNetwork.TESTNET, 'MAINNET');
      fail('expected assertNetworkMatch to throw');
    } catch (error) {
      const response = (error as ForbiddenException).getResponse() as {
        correlationId: string;
      };
      expect(typeof response.correlationId).toBe('string');
      expect(response.correlationId.length).toBeGreaterThan(0);
    }
  });

  it('never leaks the subject value beyond the static label', () => {
    const subject = 'super-secret-subject';
    try {
      assertNetworkMatch(ScopedNetwork.TESTNET, 'MAINNET', undefined, subject);
      fail('expected assertNetworkMatch to throw');
    } catch (error) {
      const response = (error as ForbiddenException).getResponse() as {
        message: string;
      };
      expect(response.message).not.toContain(subject);
    }
  });
});
