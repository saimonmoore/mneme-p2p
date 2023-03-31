import minimist from 'minimist';
import Corestore from 'corestore';
import Hyperswarm from 'hyperswarm';
import Autobase from 'autobase';
import Hyperbee from 'hyperbee';
import ram from 'random-access-memory';
// @ts-ignore
import { AutobaseManager } from '@lejeunerenard/autobase-manager';

import { UserUseCase } from '#User/application/usecases/UserUseCase/index.js';
import { SessionUseCase } from '#Session/application/usecases/SessionUseCase/index.js';
import { sessionRequiredInterceptor } from '#Session/application/usecases/SessionRequiredUseCase/SessionRequiredInterceptor.js';
import { RecordUseCase } from '#Record/application/usecases/RecordUseCase/index.js';
import { sha256 } from '#Shared/infrastructure/helpers/hash.js';

import {
  indexFriends,
  indexUsers,
} from '#User/application/indices/Users/users.index.js';
import { indexRecords } from '#Record/application/indices/Records/records.index.js';
import { OPERATIONS } from '#config/constants.js';

import type { User } from '#User/domain/entities/user.js';
import type { MnemeRecord } from '#Record/domain/entities/record.js';
import type { BeeBatch, HypercoreStream, PeerInfo } from '#Types/global.d.ts';

// TODO:
// - add tests

const args = minimist(process.argv, {
  alias: {
    storage: 's',
    email: 'e',
  },
  default: {
    swarm: true,
  },
  boolean: ['ram', 'swarm'],
});

const SWARM_TOPIC = 'org.saimonmoore.mneme.swarm';

class Mneme {
  store: Corestore;
  swarm: Hyperswarm | null;
  autobase: Autobase | null;
  bee: Hyperbee | null;
  sessionUseCase: SessionUseCase;
  userUseCase: UserUseCase;
  recordUseCase: RecordUseCase;

  constructor() {
    this.store = new Corestore(args.ram ? ram : args.storage || 'mneme');
    this.swarm = null;
    this.autobase = null;
    this.bee = null;
  }

  async start() {
    console.debug('Starting Mneme...');
    const writer = this.store.get({ name: 'writer' });
    const viewOutput = this.store.get({ name: 'view' });

    await writer.ready();
    console.debug('Writer ready');

    // @ts-ignore
    this.autobase = new Autobase({
      inputs: [writer],
      localInput: writer,
      outputs: [viewOutput],
      localOutput: viewOutput,
    });

    await this.autobase.ready();
    console.debug('Autobase ready');

    const manager = new AutobaseManager(
      this.autobase,
      () => true,
      this.store.get.bind(this.store),
      this.store.storage
    );
    await manager.ready();
    console.debug('Autobase manager ready');

    if (args.swarm) {
      const topic = Buffer.from(sha256(SWARM_TOPIC), 'hex');
      console.debug('Starting to swarm...');

      this.swarm = new Hyperswarm();
      this.swarm.on(
        'connection',
        (socket: HypercoreStream, peerInfo: PeerInfo) => {
          // @ts-ignore
          console.log(
            'info: Peer connected! ======> ',
            peerInfo.publicKey.toString('hex')
          );
          const stream = this.store.replicate(socket);

          manager.attachStream(stream);
        }
      );
      this.swarm.join(topic);
      console.debug('Joining swarm topic: ' + SWARM_TOPIC);
      await this.swarm.flush();
      console.debug('Swarm ready');
      // @ts-ignore
      process.once('SIGINT', () => this.swarm.destroy()); // for faster restarts
    }

    this.info();

    const self = this;
    this.autobase.start({
      unwrap: true,
      async apply(batch: BeeBatch) {
        if (!self.bee) {
          throw new Error('Bee not initialized');
        }

        const batchedBeeOperations = self.bee.batch({ update: false });

        // @ts-ignore
        for (const { value } of batch) {
          const operation = JSON.parse(value);

          if (operation.type === OPERATIONS.CREATE_USER) {
            await indexUsers(batchedBeeOperations, operation);
          }

          if (operation.type === OPERATIONS.ADD_FRIEND) {
            await indexFriends(batchedBeeOperations, operation);
          }

          if (operation.type === OPERATIONS.RECORD) {
            await indexRecords(batchedBeeOperations, self.bee)(operation);
          }
        }

        await batchedBeeOperations.flush();
      },
    });

    this.bee = new Hyperbee(this.autobase.view, {
      extension: false,
      keyEncoding: 'utf-8',
      valueEncoding: 'json',
    });

    this.sessionUseCase = new SessionUseCase(this.bee, this.autobase);
    this.userUseCase = sessionRequiredInterceptor(
      new UserUseCase(this.bee, this.autobase, this.sessionUseCase)
    );
    this.recordUseCase = sessionRequiredInterceptor(
      new RecordUseCase(this.bee, this.autobase, this.sessionUseCase)
    );
    console.debug('Mneme ready');
  }

  info() {
    console.log('hrepl mneme.js ');
    console.log();
    console.log('To use another storage directory use --storage ./another');
    console.log('To disable swarming add --no-swarm');
    console.log();
  }

  // ENDPOINTS

  // Record
  async *myRecords() {
    yield* this.recordUseCase.myRecords();
  }

  async *myKeywords() {
    yield* this.recordUseCase.myKeywords();
  }

  async *myKeywordsByLabel(text: string) {
    yield* this.recordUseCase.myKeywordsByLabel(text);
  }

  async *myTags() {
    yield* this.recordUseCase.myTags();
  }

  async *myTagsByLabel(text: string) {
    yield* this.recordUseCase.myTagsByLabel(text);
  }

  async *myRecordsForKeyword(keyword: string) {
    yield* this.recordUseCase.myRecordsForKeyword(keyword);
  }

  async *myRecordsForTag(tag: string) {
    yield* this.recordUseCase.myRecordsForTag(tag);
  }

  async addRecord(data: MnemeRecord) {
    return this.recordUseCase.addRecord(data);
  }

  // User
  async *users() {
    yield* this.userUseCase.users();
  }

  async *friends() {
    yield* this.userUseCase.friends();
  }

  async *friendsByName(text: string) {
    yield* this.userUseCase.friendsByName(text);
  }

  async *friendsByEmail(text: string) {
    yield* this.userUseCase.friendsByEmail(text);
  }

  async signup(user: User) {
    return this.userUseCase.signup(user);
  }

  async addFriend(userHash: string) {
    return this.userUseCase.addFriend(userHash);
  }

  // Session
  isLoggedIn() {
    return this.sessionUseCase.isLoggedIn();
  }

  async login(email: string) {
    return this.sessionUseCase.login(email);
  }

  logout() {
    return this.sessionUseCase.logout();
  }
}

export const mneme = new Mneme();

await mneme.start();
