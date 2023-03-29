import minimist from 'minimist';
import Corestore from 'corestore';
import Hyperswarm from 'hyperswarm';
import Autobase from 'autobase';
import Hyperbee from 'hyperbee';
import ram from 'random-access-memory';
import { AutobaseManager } from '@lejeunerenard/autobase-manager';

import { UserUseCase } from './modules/User/application/usecases/UserUseCase/index.js';
import { SessionUseCase } from './modules/Session/application/usecases/SessionUseCase/index.js';
import { sessionRequiredInterceptor } from './modules/Session/application/usecases/SessionRequiredUseCase/SessionRequiredInterceptor.js';
import { PostUseCase } from './modules/Post/application/usecases/PostUseCase/index.js';
import { RecordUseCase } from './modules/Record/application/usecases/RecordUseCase/index.js';
import { VoteUseCase } from './modules/Vote/application/usecases/VoteUseCase/index.js';
import { sha256 } from './modules/Shared/infrastructure/helpers/hash.js';

import { indexFriends, indexUsers } from './modules/User/application/indices/Users/users.index.js';
import {
  indexPosts,
  indexPostVotes,
} from './modules/Post/application/indices/Posts/posts.index.js';
import {
  indexRecords,
} from './modules/Record/application/indices/Records/records.index.js';
import { OPERATIONS } from './constants.js';

// TODO:
// - add tests
// - start implementing actual mneme features (See: https://excalidraw.com/#room=c4d4d9c1ba6caaa086b8,3H6dTYLLfzyFDLwIz0irmA)

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
      this.swarm.on('connection', (socket, peerInfo) => {
        console.log(
          'info: Peer connected! ======> ',
          peerInfo.publicKey.toString('hex')
        );
        const stream = this.store.replicate(socket);

        manager.attachStream(stream);
      });
      this.swarm.join(topic);
      console.debug('Joining swarm topic: ' + SWARM_TOPIC);
      await this.swarm.flush();
      console.debug('Swarm ready');
      process.once('SIGINT', () => this.swarm.destroy()); // for faster restarts
    }

    this.info();

    const self = this;
    this.autobase.start({
      unwrap: true,
      async apply(batch) {
        const batchedBeeOperations = self.bee.batch({ update: false });

        for (const { value } of batch) {
          const operation = JSON.parse(value);

          if (operation.type === OPERATIONS.CREATE_USER) {
            await indexUsers(batchedBeeOperations, operation);
          }

          if (operation.type === OPERATIONS.ADD_FRIEND) {
            await indexFriends(batchedBeeOperations, operation);
          }

          if (operation.type === OPERATIONS.RECORD) {
            await indexRecords(batchedBeeOperations, operation, self.bee);
          }

          if (operation.type === OPERATIONS.POST) {
            await indexPosts(batchedBeeOperations, operation);
          }

          if (operation.type === OPERATIONS.VOTE) {
            await indexPostVotes(batchedBeeOperations, operation, self.bee);
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
    this.userUserCase = new UserUseCase(
      this.bee,
      this.autobase,
      this.sessionUseCase
    );
    this.recordUseCase = sessionRequiredInterceptor(
      new RecordUseCase(
        this.bee,
        this.autobase,
        this.sessionUseCase
      )
    );
    this.postUseCase = sessionRequiredInterceptor(
      new PostUseCase(
        this.bee,
        this.autobase,
        this.sessionUseCase
      )
    );
    this.upvoteUseCase = sessionRequiredInterceptor(new VoteUseCase(
      this.bee,
      this.autobase,
      this.sessionUseCase
    ));
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
  async *records() {
    yield* this.recordUseCase.records();
  }

  async *keywords() {
    yield* this.recordUseCase.keywords();
  }

  async *tags() {
    yield* this.recordUseCase.tags();
  }

  async *recordsForKeyword(keyword) {
    yield* this.recordUseCase.recordsForKeyword(keyword);
  }

  async *recordsForTag(tag) {
    yield* this.recordUseCase.recordsForTag(tag);
  }

  async record(data) {
    return this.recordUseCase.record(data);
  }

  // Post
  async *posts() {
    yield* this.postUseCase.posts();
  }

  async *topPosts() {
    yield* this.postUseCase.topPosts();
  }

  async post(text) {
    return this.postUseCase.post(text);
  }

  // Vote
  async upvote(hash) {
    return this.upvoteUseCase.upvote(hash);
  }

  async downvote(hash) {
    return this.upvoteUseCase.downvote(hash);
  }

  // User
  async *users() {
    yield* this.userUserCase.users();
  }

  async *friends() {
    yield* this.userUserCase.friends();
  }

  async *friendsByName(text) {
    yield* this.userUserCase.friendsByName(text);
  }

  async *friendsByEmail(text) {
    yield* this.userUserCase.friendsByEmail(text);
  }

  async signup(user) {
    return this.userUserCase.signup(user);
  }

  // TODO: as User
  async addFriend(user) {
    return this.userUserCase.addFriend(user);
  }

  // Session
  isLoggedIn() {
    return this.sessionUseCase.isLoggedIn();
  }

  async login(email) {
    return this.sessionUseCase.login(email);
  }

  logout() {
    return this.sessionUseCase.logout();
  }
}

export const mneme = new Mneme();

await mneme.start();
