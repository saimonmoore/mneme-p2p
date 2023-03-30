import Hyperbee from 'hyperbee';

import { sha256 } from '@Shared/infrastructure/helpers/hash.js';

import type { MnemeRecord } from '@Record/domain/entities/record.js';
import type { User } from '@User/domain/entities/user.js';
import type { BeeBatch } from '@Types/global.d.ts';

export const RECORDS_KEY = 'org.mneme.records!';
export const TAGS_KEY = 'org.mneme.tags!';
export const KEYWORDS_KEY = 'org.mneme.keywords!';
export const RECORDS_BY_USER_KEY = (userHash: string) =>
  `${userHash}!${RECORDS_KEY}!`;
export const TAGS_BY_USER_KEY = (userHash: string) =>
  `${userHash}!${TAGS_KEY}!`;
export const KEYWORDS_BY_USER_KEY = (userHash: string) =>
  `${userHash}!${KEYWORDS_KEY}!`;

type RecordOperation = {
  hash: string;
  record: MnemeRecord;
  user: User;
};

export function indexRecords(batch: BeeBatch, bee: Hyperbee) {
  async function indexTags(user: User, tags: string[], hash: string) {
    await Promise.all(
      tags.map(async (tag) => {
        const tagHash = sha256(tag);
        const value = await bee.get(
          TAGS_BY_USER_KEY(user.hash as string) + tagHash,
          { update: false }
        );

        let records = value?.value?.records;

        if (records) {
          records.push(hash);
        } else {
          records = [hash];
        }

        await batch.put(TAGS_KEY + tagHash, { tag, records });
      })
    );
  }

  async function indexKeywords(user: User, keywords: string[], hash: string) {
    await Promise.all(
      keywords.map(async (keyword: string) => {
        const keywordHash = sha256(keyword);
        const value = await bee.get(
          KEYWORDS_BY_USER_KEY(user.hash as string) + keywordHash,
          { update: false }
        );

        let records = value?.value?.records;

        if (records) {
          records.push(hash);
        } else {
          records = [hash];
        }

        await batch.put(KEYWORDS_KEY + keywordHash, { keyword, records });
      })
    );
  }

  return async function (operation: RecordOperation) {
    const { record, user } = operation;

    if (!user) {
      console.error('user is undefined');
      return;
    }

    const hash = sha256(record.url);
    await batch.put(RECORDS_BY_USER_KEY(user.hash as string) + hash, {
      hash,
      record,
    });

    await indexTags(user, record.tags, hash);
    await indexKeywords(user, record.keywords, hash);
  };
}
