import minimist from 'minimist'
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import Autobase from 'autobase'
import Hyperbee from 'hyperbee'
import crypto from 'crypto'
import lexint from 'lexicographic-integer'
import ram from 'random-access-memory'
import { AutobaseManager } from '@lejeunerenard/autobase-manager'

const args = minimist(process.argv, {
  alias: {
    storage: 's',
    email: "e",
  },
  default: {
    swarm: true
  },
  boolean: ['ram', 'swarm']
})

const SWARM_TOPIC = "org.saimonmoore.mneme.swarm";

class Mneme {
  constructor () {
    this.store = new Corestore(args.ram ? ram : (args.storage || 'mneme'))
    this.swarm = null
    this.autobase = null
    this.bee = null
  }

  async start () {
    const writer = this.store.get({ name: 'writer' })
    const viewOutput = this.store.get({ name: 'view' })

    await writer.ready()

    this.autobase = new Autobase({ 
      inputs: [writer], 
      localInput: writer, 
      outputs: [viewOutput], 
      localOutput: viewOutput
    })

    await this.autobase.ready()

    const manager = new AutobaseManager(
      this.autobase,
      () => true,
      this.store.get.bind(this.store),
      this.store.storage
    )
    await manager.ready()

    if (args.swarm) {
      const topic = Buffer.from(sha256(SWARM_TOPIC), "hex");
      this.swarm = new Hyperswarm()
      this.swarm.on('connection', (socket, peerInfo) => {
        console.log('info: Peer connected! ======> ', peerInfo.publicKey.toString('hex'));
        const stream = this.store.replicate(socket)

        manager.attachStream(stream)
      })
      this.swarm.join(topic)
      await this.swarm.flush()
      process.once('SIGINT', () => this.swarm.destroy()) // for faster restarts
    }

    this.info()

    const self = this
    this.autobase.start({ 
      unwrap: true, 
      async apply(batch) {
        const b = self.bee.batch({ update: false })

        for (const { value } of batch) {
          const op = JSON.parse(value)

          if (op.type === "createUser") {
            const { hash, data } = op;
            console.debug("[apply] ===========> CREATE_USER: ", { hash, data });
            await b.put("users!" + hash, { hash, data });
            console.debug("[apply] ===========> CREATED_USER! ", {
              hash,
              data,
            });
          }

          if (op.type === 'post') {
            const hash = sha256(op.data)
            await b.put('posts!' + hash, { hash, votes: 0, data: op.data })
            await b.put('top!' + lexint.pack(0, 'hex') + '!' + op.hash, op.hash);
          }

          if (op.type === 'vote') {
            const inc = op.up ? 1 : -1
            const p = await self.bee.get('posts!' + op.hash, { update: false })

            if (!p) continue

            await b.del('top!' + lexint.pack(p.value.votes, 'hex') + '!' + op.hash)
            p.value.votes += inc
            await b.put('posts!' + op.hash, p.value)
            await b.put('top!' + lexint.pack(p.value.votes, 'hex') + '!' + op.hash, op.hash);
          }
        }

        await b.flush()
      }
    })

    this.bee = new Hyperbee(this.autobase.view, {
      extension: false,
      keyEncoding: 'utf-8',
      valueEncoding: 'json'
    })
  }

  info () {
    console.log('hrepl mneme.js ');
    console.log()
    console.log('To use another storage directory use --storage ./another')
    console.log('To disable swarming add --no-swarm')
    console.log()
  }

  async * all () {
    for await (const data of this.bee.createReadStream({ gt: 'posts!', lt: 'posts!~' })) {
      yield data.value
    }
  }

  async * top () {
    for await (const data of this.bee.createReadStream({ gt: 'top!', lt: 'top!~', reverse: true })) {
      const { value } = (await this.bee.get('posts!' + data.value))
      yield value
    }
  }


  async post (text) {
    const hash = sha256(text)

    await this.autobase.append(JSON.stringify({
      type: 'post',
      hash,
      data: text
    }))
  }

  async upvote (hash) {
    await this.autobase.append(JSON.stringify({
      type: 'vote',
      hash,
      up: true
    }))
  }

  async downvote (hash) {
    await this.autobase.append(JSON.stringify({
      type: 'vote',
      hash,
      up: false
    }))
  }
}

export const mneme = new Mneme()

await mneme.start()

function sha256 (inp) {
  return crypto.createHash('sha256').update(inp).digest('hex')
}
