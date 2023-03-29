import { sha256 } from '../../../Shared/infrastructure/helpers/hash.js';

export class User {
  constructor({ email, displayName, avatarUrl }) {
    this.email = email;
    this.hash = sha256(email);
    this.displayName = displayName;
    this.avatarUrl = avatarUrl;
  }
}
