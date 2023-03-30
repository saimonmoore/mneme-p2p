import { sha256 } from '../../../Shared/infrastructure/helpers/hash.js';
import { User } from '../../../User/domain/entities/user.js';

export enum MnemeRecordType {
  TWITTER = 'twitter',
  YOUTUBE = 'youtube',
  INSTAGRAM = 'instagram',
  HTML = 'html',
  PDF = 'pdf',
};

export type MnemeRecord = {
  url: string;
  type: MnemeRecordType;
  keywords: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  hash?: string;
  creator: User;
};

export class RecordEntity {
  url: string;
  hash: string;
  type: MnemeRecordType;
  keywords: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  creator: User;

  constructor({
    url,
    type,
    keywords,
    tags,
    creator,
  }: MnemeRecord) {
    this.url = url;
    this.hash = sha256(url);
    this.type = type;
    this.keywords = keywords;
    this.tags = tags;
    this.creator = creator;
    this.createdAt = new Date();
    this.updatedAt = this.createdAt
  }
}
