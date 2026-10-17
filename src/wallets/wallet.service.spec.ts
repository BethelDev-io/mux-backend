import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';

describe('WalletService', () => {
  let service: WalletService;

  const prismaMock = {
    wallet: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  describe('redactAddress', () => {
    const fullAddress =
      'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H';

    it('never returns the full address for a realistic Stellar address', () => {
      const redacted = (service as any).redactAddress(fullAddress);

      expect(redacted).not.toContain(fullAddress);
      expect(redacted).not.toBe(fullAddress);
      expect(redacted.length).toBeLessThan(fullAddress.length);
    });

    it('returns a safe value for an empty string without throwing', () => {
      expect(() => (service as any).redactAddress('')).not.toThrow();
      const redacted = (service as any).redactAddress('');
      expect(typeof redacted).toBe('string');
      expect(redacted).not.toBe('');
    });

    it('returns a safe value for a short string without throwing', () => {
      expect(() => (service as any).redactAddress('abc')).not.toThrow();
      const redacted = (service as any).redactAddress('abc');
      expect(typeof redacted).toBe('string');
      expect(redacted).not.toBe('abc');
    });
  });

  describe('registration logging', () => {
    const fullAddress =
      'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H';

    it('logs the redacted form and not the raw address on success', async () => {
      const logSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);

      prismaMock.wallet.findUnique.mockResolvedValue(null);
      prismaMock.wallet.create.mockResolvedValue({
        id: 'wallet-1',
        address: fullAddress,
      });

      await service.registerWallet(fullAddress);

      const redacted = (service as any).redactAddress(fullAddress);
      const loggedMessages = logSpy.mock.calls
        .map((call) => call.map((arg) => String(arg)).join(' '))
        .join('\n');

      expect(loggedMessages).toContain(redacted);
      expect(loggedMessages).not.toContain(fullAddress);

      logSpy.mockRestore();
    });
  });
});
