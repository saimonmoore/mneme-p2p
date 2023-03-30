import Autobase from 'autobase';
import Hyperbee from 'hyperbee';

import { Validator } from 'jsonschema';

import { sha256 } from '../../../../Shared/infrastructure/helpers/hash.js';
import { OPERATIONS } from '../../../../../constants.js';
import { RECORDS_KEY, TAGS_KEY, KEYWORDS_KEY } from '../../indices/Records/records.index.js';
import schema from '../../../domain/entities/record.schema.json' assert { type: 'json' };

import type { MnemeRecord } from '../../../domain/entities/record.js';
import { SessionUseCase } from '../../../../Session/application/usecases/SessionUseCase/SessionUseCase.js';

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

  async *records() {
    // @ts-ignore
    for await (const data of this.bee.createReadStream({
      gt: RECORDS_KEY,
      lt: `${RECORDS_KEY}~`,
    })) {
      yield data.value;
    }
  }

  async *keywords() {
    // @ts-ignore
    for await (const data of this.bee.createReadStream({
      gt: KEYWORDS_KEY,
      lt: `${KEYWORDS_KEY}~`,
    })) {
      yield data.value.keyword;
    }
  }

  async *recordsForKeyword(keyword: string) {
    const keywordHash = sha256(keyword);
    const result = await this.bee.get(`${KEYWORDS_KEY}${keywordHash}`, { update: false });

    if (!result) {
      console.log('No records found for keyword: ' + keyword);
      return;
    }

    const records = result.value.records;

    for (const hash of records) {
      const entry = await this.bee.get(RECORDS_KEY + hash, { update: false });
      yield entry.value.record;
    }
  }

  async *tags() {
    // @ts-ignore
    for await (const data of this.bee.createReadStream({
      gt: TAGS_KEY,
      lt: `${TAGS_KEY}~`,
    })) {
      yield data.value.tag;
    }
  }

  async *recordsForTag(tag: string) {
    const tagHash = sha256(tag);
    const result = await this.bee.get(`${TAGS_KEY}${tagHash}`, { update: false });

    if (!result) {
      console.log('No records found for tag: ' + tag);
      return;
    }

    const records = result.value.records;

    for (const hash of records) {
      const entry = await this.bee.get(RECORDS_KEY + hash, { update: false });
      yield entry.value.record;
    }
  }

  async record(data: MnemeRecord) {
    const validation = validateRecord(data);

    if (!validation.valid) {
      console.error('Unable to create! Invalid record');
      return { error: validation.errors };
    }

    console.log('Created record: ' + data);

    return await this.autobase.append(
      JSON.stringify({
        type: OPERATIONS.RECORD,
        record: data,
        // owner
      })
    );
  }
}

export { RecordUseCase };
