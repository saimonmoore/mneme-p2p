import { Validator } from 'jsonschema';

import { sha256 } from '../../../../Shared/infrastructure/helpers/hash.js';
import { OPERATIONS } from '../../../../../constants.js';
import { RECORDS_KEY, TAGS_KEY, KEYWORDS_KEY } from '../../indices/Records/records.index.js';
import schema from '../../../domain/entities/record.schema.json' assert { type: 'json' };

function validateRecord(record) {
  const validator = new Validator();

  // TODO: Link creator to user
  return validator.validate(record, schema);
}

// /userHash/records/recordHash
// /userHash/tags/tagHash
// /userHash/keywords/keywordHash

class RecordUseCase {
  constructor(bee, autobase, session) {
    this.bee = bee;
    this.autobase = autobase;
    this.session = session;
  }

  async *records() {
    for await (const data of this.bee.createReadStream({
      gt: RECORDS_KEY,
      lt: `${RECORDS_KEY}~`,
    })) {
      yield data.value;
    }
  }

  async *keywords() {
    for await (const data of this.bee.createReadStream({
      gt: KEYWORDS_KEY,
      lt: `${KEYWORDS_KEY}~`,
    })) {
      yield data.value.keyword;
    }
  }

  async *recordsForKeyword(keyword) {
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
    for await (const data of this.bee.createReadStream({
      gt: TAGS_KEY,
      lt: `${TAGS_KEY}~`,
    })) {
      yield data.value.tag;
    }
  }

  async *recordsForTag(tag) {
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

  async record(data) {
    const validation = validateRecord(data);

    if (!validation.valid) {
      console.error('Unable to create! Invalid record');
      return { error: validation.errors };
    }

    await this.autobase.append(
      JSON.stringify({
        type: OPERATIONS.RECORD,
        record: data,
        // owner
      })
    );

    console.log('Created record: ' + data);
  }
}

export { RecordUseCase };
