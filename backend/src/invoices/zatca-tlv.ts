import { Buffer } from 'node:buffer';

/** ZATCA Phase 1 style TLV segment: [tag: u8][len: u8][value: utf8]. */
export function tlv(tag: number, value: string): Buffer {
  const val = Buffer.from(value, 'utf8');
  if (val.length > 255) {
    throw new Error('TLV value exceeds 255 bytes');
  }
  return Buffer.concat([Buffer.from([tag, val.length]), val]);
}

export type ZatcaPhase1Fields = {
  sellerName: string;
  vatNumber: string;
  timestampIso: string;
  totalWithVat: string;
  vatAmount: string;
};

export function buildZatcaPhase1TlvBase64(fields: ZatcaPhase1Fields): string {
  const parts = [
    tlv(1, fields.sellerName),
    tlv(2, fields.vatNumber),
    tlv(3, fields.timestampIso),
    tlv(4, fields.totalWithVat),
    tlv(5, fields.vatAmount),
  ];
  return Buffer.concat(parts).toString('base64');
}
