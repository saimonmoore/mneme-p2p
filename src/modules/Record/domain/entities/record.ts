import { sha256 } from '#Shared/infrastructure/helpers/hash.js';
import { User } from '#User/domain/entities/user.js';

export enum MnemeRecordType {
  TWITTER = 'twitter',
  YOUTUBE = 'youtube',
  HTML = 'html',
  PDF = 'pdf',
}

export type MnemeRecord = {
  url: string;
  type: MnemeRecordType;
  keywords: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  hash?: string;
  creatorHash: string;
  creator?: User;
};

export class RecordEntity {
  url: string;
  hash: string;
  type: MnemeRecordType;
  keywords: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  creatorHash: string;

  constructor({
    url,
    type,
    keywords,
    tags,
    creatorHash,
    createdAt,
    updatedAt,
  }: MnemeRecord) {
    this.url = url;
    this.hash = sha256(url);
    this.type = type;
    this.keywords = keywords;
    this.tags = tags;
    this.creatorHash = creatorHash;
    this.createdAt = new Date(createdAt);
    this.updatedAt = new Date(updatedAt);
  }

  set creator(user: User) {
    this.creator = user;
  }
}
