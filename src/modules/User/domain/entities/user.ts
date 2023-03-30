import { sha256 } from '@Shared/infrastructure/helpers/hash.js';

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

  constructor({ email, displayName, avatarUrl }: User) {
    this.email = email;
    this.hash = sha256(email);
    this.displayName = displayName;
    this.avatarUrl = avatarUrl;
  }
}
