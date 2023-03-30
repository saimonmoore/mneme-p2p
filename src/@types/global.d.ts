import type { Stream } from 'node:stream';

export type HypercoreStream = boolean | Stream;
export type PeerInfo = {
  publicKey: Buffer;
  topics: Buffer[];
  prioritized: boolean;
}

export type BeeBatch = {
  put: (key: string, value: any) => Promise<void>;
}
