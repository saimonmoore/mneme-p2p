import Autobase from 'autobase';
import Hyperbee from 'hyperbee';

import { sha256 } from '../../../../Shared/infrastructure/helpers/hash.js';
import { USERS_KEY } from '../../../../User/application/indices/Users/users.index.js';

import { User } from '../../../../User/domain/entities/user.js';

class SessionUseCase {
  bee: Hyperbee;
  autobase: Autobase;
  currentUser?: User;

  constructor(bee: Hyperbee, autobase: Autobase) {
    this.bee = bee;
    this.autobase = autobase;
    this.currentUser;
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  directLogin(user: User) {
    this.currentUser = user;
    console.log('Logged in as "' + user.email + '"');
  }

  async login(email: string) {
    const hash = sha256(email);
    console.log('Logging in as "' + email + '"');

    if (this.isLoggedIn()) {
      console.log(`Already logged in as ${email}`);
      return;
    }

    const entry = await this.bee.get(USERS_KEY + hash);
    console.log('Got entry from bee', { entry });

    if (!entry) {
      console.log(`Please sign up! No user found for "${email}".`);
      return;
    }

    const user = entry.value.user;

    this.currentUser = user;
    console.log('Logged in as "' + this.currentUser?.email + '"');
  }

  logout() {
    this.currentUser = undefined;
    console.log('Logged out');
  }
}

export { SessionUseCase };
