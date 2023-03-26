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

import { indexUsers } from './modules/User/application/indices/Users/users.index.js';
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
    const writer = this.store.get({ name: 'writer' });
    const viewOutput = this.store.get({ name: 'view' });

    await writer.ready();

    this.autobase = new Autobase({
      inputs: [writer],
      localInput: writer,
      outputs: [viewOutput],
      localOutput: viewOutput,
    });

    await this.autobase.ready();

    const manager = new AutobaseManager(
      this.autobase,
      () => true,
      this.store.get.bind(this.store),
      this.store.storage
    );
    await manager.ready();

    if (args.swarm) {
      const topic = Buffer.from(sha256(SWARM_TOPIC), 'hex');
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
      await this.swarm.flush();
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

          if (operation.type === OPERATIONS.RECORD) {
            await indexRecords(batchedBeeOperations, operation);
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

  async signup(email) {
    return this.userUserCase.signup(email);
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
