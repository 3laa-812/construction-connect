/**
 * Ensures `otplib` is referenced at build time (Section 11 dependency).
 * Registration OTP uses bcrypt-hashed random codes; otplib is reserved for MFA.
 */
import { generateSecret } from 'otplib';

export function assertOtplibAvailable(): void {
  if (typeof generateSecret !== 'function') {
    throw new Error('otplib not available');
  }
}
