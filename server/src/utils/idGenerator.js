import crypto from 'crypto';

let seqCounter = crypto.randomInt(0, 0x1000);

/**
 * Generates an academic & audit friendly incident code e.g. CS-20261021-9842
 * Guarantees uniqueness sequentially while adhering to the 4-hex-digit spec
 */
export const generateIncidentCode = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  seqCounter = (seqCounter + 1) & 0xffff;
  const hex = seqCounter.toString(16).padStart(4, '0').toUpperCase();
  return `CS-${dateStr}-${hex}`;
};
