import { Validator } from 'jsonschema';

import { OPERATIONS } from '../../../../../constants.js';
import { RECORDS_KEY } from '../../indices/Records/records.index.js';
import schema from '../../../domain/entities/record.schema.json' assert { type: 'json' };

function validateRecord(record) {
  const validator = new Validator();

  // TODO: Link creator to user
  return validator.validate(record, schema);
}

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
      })
    );

    console.log('Created record: ' + data);
  }
}

export { RecordUseCase };
