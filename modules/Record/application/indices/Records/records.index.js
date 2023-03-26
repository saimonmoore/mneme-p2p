import { sha256 } from '../../../../Shared/infrastructure/helpers/hash.js';

export const RECORDS_KEY = 'org.mneme.records!';

export async function indexRecords(batch, operation) {
  const hash = sha256(JSON.stringify(operation.record));
  await batch.put(RECORDS_KEY + hash, { hash, record: operation.record });
}
