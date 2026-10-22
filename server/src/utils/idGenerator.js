import crypto from 'crypto';

/**
 * Generates an academic & audit friendly incident code e.g. CS-20261021-9842
 */
export const generateIncidentCode = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CS-${dateStr}-${randomHex}`;
};
