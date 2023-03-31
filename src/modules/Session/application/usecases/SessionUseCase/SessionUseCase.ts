import Autobase from 'autobase';
import Hyperbee from 'hyperbee';

import { sha256 } from '#Shared/infrastructure/helpers/hash.js';
import { USERS_KEY } from '#User/application/indices/Users/users.index.js';
import { User } from '#User/domain/entities/user.js';
import { logger } from '#infrastructure/logging/index.js';

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
    logger.info('Logged in as "' + user.email + '"');
  }

  async login(email: string) {
    const hash = sha256(email);
    logger.info('Logging in as "' + email + '"');

    if (this.isLoggedIn()) {
      logger.info(`Already logged in as ${email}`);
      return;
    }

    const entry = await this.bee.get(USERS_KEY + hash);

    if (!entry) {
      logger.info(`Please sign up! No user found for "${email}".`);
      return;
    }

    const user = entry.value.user;

    this.currentUser = user;
    logger.info('Logged in as "' + this.currentUser?.email + '"');
  }

  logout() {
    this.currentUser = undefined;
    logger.info('Logged out');
  }
}

export { SessionUseCase };
