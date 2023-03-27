import { sha256 } from '../../../../Shared/infrastructure/helpers/hash.js';
import { USERS_KEY } from '../../../../User/application/indices/Users/users.index.js';

class SessionUseCase {
  constructor(bee, autobase) {
    this.bee = bee;
    this.autobase = autobase;
    this.currentUser = null;
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  directLogin(user) {
    this.currentUser = user;
    console.log('Logged in as "' + user.email + '"');
  }

  async login(email) {
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
    console.log('Logged in as "' + this.currentUser.email + '"');
  }

  logout() {
    this.currentUser = null;
    console.log('Logged out');
  }
}

export { SessionUseCase };
