import { generateToken, verifyToken } from '../src/utils/jwt.js';
import bcrypt from 'bcryptjs';

describe('Authentication & Security Unit Tests', () => {
  const sampleUserId = '6650a1b2c3d4e5f6a7b8c9d0';

  test('generateToken should produce a valid 3-part JWT string', () => {
    const token = generateToken(sampleUserId, 'USER');
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  test('verifyToken should successfully decode user ID and role', () => {
    const token = generateToken(sampleUserId, 'RESPONDER');
    const decoded = verifyToken(token);
    expect(decoded.id).toBe(sampleUserId);
    expect(decoded.role).toBe('RESPONDER');
  });

  test('verifyToken should reject a tampered token signature', () => {
    const token = generateToken(sampleUserId, 'USER');
    const tamperedToken = token.slice(0, -5) + 'abcde';
    expect(() => verifyToken(tamperedToken)).toThrow();
  });

  test('bcrypt should securely hash password and verify match', async () => {
    const password = 'SuperSecureEmergency2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);

    const isCorrect = await bcrypt.compare(password, hash);
    const isWrong = await bcrypt.compare('WrongPassword123!', hash);

    expect(isCorrect).toBe(true);
    expect(isWrong).toBe(false);
  });
});
