declare module 'autobase' {
  class Autobase {
    view: any;

    constructor(storage: any, options?: { key?: string, valueEncoding?: string, map?: (key: string, value: any) => any });

    ready(): Promise<void>;
    start(options: any): Promise<void>;
    append(value: unknown): Promise<void>;
  }

  export default Autobase;
}

declare module 'corestore' {

  class Corestore {
    storage: any;

    constructor(storage: string);

    ready(): Promise<void>;
    get(options?: { name: string }): any;
    replicate(stream: any): any;
  }

  export default Corestore;
}

declare module 'hyperswarm' {

  class Hyperswarm {
    constructor();

    join(topic: Buffer): any;
    flush(): Promise<void>;
    on(event: string, callback: (socket: any, peerInfo: any) => void): void;
    destroy(): void;
  }

  export default Hyperswarm;
}

declare module 'hyperbee' {
  class Hyperbee {
    constructor(storage: any, options?: { extension: boolean, keyEncoding?: string, valueEncoding?: string });
    ready(): Promise<void>;
    get(key: string, options?: { update?: boolean }): Promise<any>;
    batch(options: any): any;
  }
  export default Hyperbee;
}

declare module 'random-access-memory' {
  import * as ram from 'random-access-memory';

  export default ram;
}
