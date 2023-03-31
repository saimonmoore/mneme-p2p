import { sha256 } from '#Shared/infrastructure/helpers/hash.js';

export type User = {
  email: string;
  displayName: string;
  avatarUrl: string;
  hash?: string;
};

export class UserEntity {
  email: string;
  hash: string;
  displayName: string;
  avatarUrl: string;

  static create(user: User) {
    return new UserEntity(user);
  }

  constructor({ hash, email, displayName, avatarUrl }: User) {
    this.email = email;
    this.hash = hash || sha256(email);
    this.displayName = displayName;
    this.avatarUrl = avatarUrl;
  }
}
