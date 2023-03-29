import crypto from 'crypto';

export function sha256(inp) {
  return crypto.createHash('sha256').update(inp).digest('hex');
}
