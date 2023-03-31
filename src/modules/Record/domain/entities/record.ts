import { sha256 } from '#Shared/infrastructure/helpers/hash.js';
import { UserEntity } from '#User/domain/entities/user.js';

import type { User } from '#User/domain/entities/user.js';

export type MnemeTopic = {
  label: string;
  wikiLink: string;
  records?: MnemeRecord[];
};

export enum MnemeRecordType {
  TWITTER = 'twitter',
  YOUTUBE = 'youtube',
  HTML = 'html',
  PDF = 'pdf',
}

export type MnemeRecord = {
  url: string;
  type: MnemeRecordType;
  keywords: MnemeTopic[];
  tags: MnemeTopic[];
  createdAt: string;
  updatedAt: string;
  hash?: string;
  language?: string;
  creatorHash: string;
  creator?: User;
};

export class RecordEntity {
  url: string;
  hash: string;
  language: string;
  type: MnemeRecordType;
  keywords: MnemeTopic[];
  tags: MnemeTopic[];
  createdAt: Date;
  updatedAt: Date;
  creatorHash: string;
  creator: UserEntity;

  static create(record: MnemeRecord) {
    return new RecordEntity(record);
  }

  constructor({
    hash,
    url,
    type,
    language,
    keywords,
    tags,
    creatorHash,
    createdAt,
    updatedAt,
  }: MnemeRecord) {
    this.url = url;
    this.hash = hash || sha256(url);
    this.type = type;
    this.keywords = keywords;
    this.tags = tags;
    this.creatorHash = creatorHash;
    this.createdAt = new Date(createdAt);
    this.updatedAt = new Date(updatedAt);

    if (language) {
      this.language = language;
    }
  }

  setCreator(user: User) {
    this.creator = UserEntity.create(user);
  }
}
