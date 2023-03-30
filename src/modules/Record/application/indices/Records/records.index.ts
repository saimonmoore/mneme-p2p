import Hyperbee from 'hyperbee';

import { sha256 } from '../../../../Shared/infrastructure/helpers/hash.js';
import { RecordEntity } from '../../../domain/entities/record.js';

import type { BeeBatch } from '../../../../../@types/global.d.ts'

export const RECORDS_KEY = 'org.mneme.records!';
export const TAGS_KEY = 'org.mneme.tags!';
export const KEYWORDS_KEY = 'org.mneme.keywords!';

type RecordOperation = {
  hash: string;
  record: RecordEntity;
};

async function indexTags(tags: string[], hash: string, batch: BeeBatch, bee: Hyperbee) {
  await Promise.all(tags.map(async (tag) => {
    const tagHash = sha256(tag);
    const value = await bee.get(TAGS_KEY + tagHash, { update: false });

    let records = value?.value?.records;

    if (records) {
      records.push(hash);
    } else {
      records = [hash];
    };

    await batch.put(TAGS_KEY + tagHash, { tag, records });
  }));
}

async function indexKeywords(keywords: string[], hash: string, batch: BeeBatch, bee: Hyperbee) {
  await Promise.all(keywords.map(async (keyword: string) => {
    const keywordHash = sha256(keyword);
    const value = await bee.get(KEYWORDS_KEY + keywordHash, { update: false });

    let records = value?.value?.records;

    if (records) {
      records.push(hash);
    } else {
      records = [hash];
    };

    await batch.put(KEYWORDS_KEY + keywordHash, { keyword, records });
  }));
}

export async function indexRecords(batch: BeeBatch, operation: RecordOperation, bee: Hyperbee) {
  const record = operation.record;
  const hash = sha256(record.url);
  await batch.put(RECORDS_KEY + hash, { hash, record });

  await indexTags(record.tags, hash, batch, bee);
  await indexKeywords(record.keywords, hash, batch, bee);
}
