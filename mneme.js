import minimist from 'minimist';
import Corestore from 'corestore';
import Hyperswarm from 'hyperswarm';
import Autobase from 'autobase';
import Hyperbee from 'hyperbee';
import lexint from 'lexicographic-integer';
import ram from 'random-access-memory';
import { AutobaseManager } from '@lejeunerenard/autobase-manager';

import { UserUseCase } from './modules/User/application/usecases/UserUseCase/index.js';
import { SessionUseCase } from './modules/Session/application/usecases/SessionUseCase/index.js';
import { PostUseCase } from './modules/Post/application/usecases/PostUseCase/index.js';
import { VoteUseCase } from './modules/Vote/application/usecases/VoteUseCase/index.js';
import { sha256 } from './modules/Shared/infrastructure/helpers/hash.js';

// TODO:
// - cleanup code
// - add tests
// - check if user logged in before posting
// - separate into modules (user, posts, voting, etc)
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
        const b = self.bee.batch({ update: false });

        for (const { value } of batch) {
          const op = JSON.parse(value);

          if (op.type === 'createUser') {
            const { hash, data } = op;
            await b.put('users!' + hash, { hash, data });
          }

          if (op.type === 'post') {
            const hash = sha256(op.data);
            await b.put('posts!' + hash, { hash, votes: 0, data: op.data });
            await b.put(
              'top!' + lexint.pack(0, 'hex') + '!' + op.hash,
              op.hash
            );
          }

          if (op.type === 'vote') {
            const inc = op.up ? 1 : -1;
            const p = await self.bee.get('posts!' + op.hash, { update: false });

            if (!p) continue;

            await b.del(
              'top!' + lexint.pack(p.value.votes, 'hex') + '!' + op.hash
            );
            p.value.votes += inc;
            await b.put('posts!' + op.hash, p.value);
            await b.put(
              'top!' + lexint.pack(p.value.votes, 'hex') + '!' + op.hash,
              op.hash
            );
          }
        }

        await b.flush();
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
    this.postUseCase = new PostUseCase(this.bee, this.autobase);
    this.upvoteUseCase = new VoteUseCase(this.bee, this.autobase);
  }

  info() {
    console.log('hrepl mneme.js ');
    console.log();
    console.log('To use another storage directory use --storage ./another');
    console.log('To disable swarming add --no-swarm');
    console.log();
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
