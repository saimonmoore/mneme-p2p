import Autobase from 'autobase';
import Hyperbee from 'hyperbee';

import { Validator } from 'jsonschema';

import { sha256 } from '#Shared/infrastructure/helpers/hash.js';
import { OPERATIONS } from '#config/constants.js';
import {
  RECORDS_BY_USER_KEY,
  TAGS_BY_USER_KEY,
  KEYWORDS_BY_USER_KEY,
} from '#Record/application/indices/Records/records.index.js';
import schema from '#Record/domain/entities/record.schema.json' assert { type: 'json' };

import type { MnemeRecord } from '#Record/domain/entities/record.js';
import { SessionUseCase } from '#Session/application/usecases/SessionUseCase/SessionUseCase.js';

function validateRecord(record: MnemeRecord) {
  const validator = new Validator();

  // TODO: Link creator to user
  return validator.validate(record, schema as any);
}

// /userHash/records/recordHash
// /userHash/tags/tagHash
// /userHash/keywords/keywordHash

class RecordUseCase {
  bee: Hyperbee;
  autobase: Autobase;
  session: SessionUseCase;

  constructor(bee: Hyperbee, autobase: Autobase, session: SessionUseCase) {
    this.bee = bee;
    this.autobase = autobase;
    this.session = session;
  }

  async *myRecords() {
    const currentUserHash = this.session.currentUser?.hash;

    // @ts-ignore
    for await (const data of this.bee.createReadStream({
      gt: RECORDS_BY_USER_KEY(currentUserHash as string),
      lt: `${RECORDS_BY_USER_KEY(currentUserHash as string)}~`,
    })) {
      yield data.value;
    }
  }

  async *myKeywords() {
    const currentUserHash = this.session.currentUser?.hash;

    // @ts-ignore
    for await (const data of this.bee.createReadStream({
      gt: KEYWORDS_BY_USER_KEY(currentUserHash as string),
      lt: `${KEYWORDS_BY_USER_KEY(currentUserHash as string)}~`,
    })) {
      yield data.value.keyword;
    }
  }

  async *myRecordsForKeyword(keyword: string) {
    const keywordHash = sha256(keyword);
    const currentUserHash = this.session.currentUser?.hash;

    const result = await this.bee.get(
      `${KEYWORDS_BY_USER_KEY(currentUserHash as string)}${keywordHash}`,
      { update: false }
    );

    if (!result) {
      console.log('No records found for keyword: ' + keyword);
      return;
    }

    const records = result.value.records;

    for (const hash of records) {
      const entry = await this.bee.get(
        RECORDS_BY_USER_KEY(currentUserHash as string) + hash,
        { update: false }
      );
      yield entry.value.record;
    }
  }

  async *myTags() {
    const currentUserHash = this.session.currentUser?.hash;

    // @ts-ignore
    for await (const data of this.bee.createReadStream({
      gt: TAGS_BY_USER_KEY(currentUserHash as string),
      lt: `${TAGS_BY_USER_KEY(currentUserHash as string)}~`,
    })) {
      yield data.value.tag;
    }
  }

  async *myRecordsForTag(tag: string) {
    const tagHash = sha256(tag);
    const currentUserHash = this.session.currentUser?.hash;

    const result = await this.bee.get(
      `${TAGS_BY_USER_KEY(currentUserHash as string)}${tagHash}`,
      { update: false }
    );

    if (!result) {
      console.log('No records found for tag: ' + tag);
      return;
    }

    const records = result.value.records;

    for (const hash of records) {
      const entry = await this.bee.get(
        RECORDS_BY_USER_KEY(currentUserHash as string) + hash,
        { update: false }
      );
      yield entry.value.record;
    }
  }

  async addRecord(data: MnemeRecord) {
    const validation = validateRecord(data);

    if (!validation.valid) {
      console.error('Unable to create! Invalid record');
      return { error: validation.errors };
    }

    if (!this.session.currentUser) {
      console.error('Unable to create! No user logged in');
      return { error: 'No user logged in' };
    }

    console.log('Created record: ' + data);

    return await this.autobase.append(
      JSON.stringify({
        type: OPERATIONS.RECORD,
        record: data,
        user: this.session.currentUser,
      })
    );
  }
}

export { RecordUseCase };
