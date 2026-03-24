import { buildZatcaPhase1TlvBase64, tlv } from './zatca-tlv';

describe('buildZatcaPhase1TlvBase64', () => {
  it('returns valid Base64 TLV payload', () => {
    const b64 = buildZatcaPhase1TlvBase64({
      sellerName: 'Test Co',
      vatNumber: '300000000000003',
      timestampIso: '2025-01-01T12:00:00Z',
      totalWithVat: '115.00',
      vatAmount: '15.00',
    });
    expect(b64).toMatch(/^[A-Za-z0-9+/]+=*$/);
    const buf = Buffer.from(b64, 'base64');
    expect(buf.length).toBeGreaterThan(10);
  });

  it('tlv throws when value exceeds 255 bytes', () => {
    const long = 'x'.repeat(300);
    expect(() => tlv(1, long)).toThrow(/255/);
  });
});
