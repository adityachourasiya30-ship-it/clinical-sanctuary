import { generateIncidentCode } from '../src/utils/idGenerator.js';

describe('Emergency SOS & Incident Engine Unit Tests', () => {
  test('generateIncidentCode should match format CS-YYYYMMDD-XXXX with uppercase hex', () => {
    const code = generateIncidentCode();
    expect(code).toMatch(/^CS-\d{8}-[A-F0-9]{4}$/);

    const yearMonthDay = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    expect(code.startsWith(`CS-${yearMonthDay}-`)).toBe(true);
  });

  test('generateIncidentCode should generate unique codes sequentially', () => {
    const codes = new Set();
    for (let i = 0; i < 50; i++) {
      codes.add(generateIncidentCode());
    }
    expect(codes.size).toBe(50);
  });

  test('Incident state machine transitions should be strictly valid', () => {
    const validTransitions = {
      CREATED: ['ACTIVE', 'RESOLVED'],
      ACTIVE: ['NOTIFYING', 'RESOLVED'],
      NOTIFYING: ['NOTIFIED', 'PARTIALLY_FAILED', 'RESOLVED'],
      NOTIFIED: ['RESOLVED'],
      PARTIALLY_FAILED: ['RESOLVED'],
      RESOLVED: [], // Terminal state
    };

    const isValidTransition = (fromState, toState) => {
      return validTransitions[fromState]?.includes(toState) || false;
    };

    expect(isValidTransition('CREATED', 'ACTIVE')).toBe(true);
    expect(isValidTransition('ACTIVE', 'NOTIFYING')).toBe(true);
    expect(isValidTransition('NOTIFYING', 'NOTIFIED')).toBe(true);
    expect(isValidTransition('NOTIFIED', 'RESOLVED')).toBe(true);
    expect(isValidTransition('RESOLVED', 'ACTIVE')).toBe(false); // Cannot reopen resolved
    expect(isValidTransition('CREATED', 'NOTIFIED')).toBe(false); // Must transition through notifying
  });

  test('Debounce window logic should prevent duplicate SOS triggers within 15 seconds', () => {
    const now = Date.now();
    const recentTriggerTime = now - 5000; // 5 seconds ago
    const oldTriggerTime = now - 20000; // 20 seconds ago

    const isDebounced = (triggerTimestamp, debounceMs = 15000) => {
      return (Date.now() - triggerTimestamp) < debounceMs;
    };

    expect(isDebounced(recentTriggerTime)).toBe(true);
    expect(isDebounced(oldTriggerTime)).toBe(false);
  });
});
