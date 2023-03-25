import { sha256 } from '../../../../Shared/infrastructure/helpers/hash.js';

class SessionUseCase {
  constructor(bee, autobase) {
    this.bee = bee;
    this.autobase = autobase;
    this.loggedIn = false;
  }

  isLoggedIn() {
    return !!this.loggedIn;
  }

  directLogin(email) {
    this.loggedIn = true;
    console.log('Logged in as "' + email + '"');
  }

  async login(email) {
    const hash = sha256(email);

    if (this.isLoggedIn()) {
      console.log(`Already logged in as ${email}`);
      return;
    }

    const value = await this.bee.get('users!' + hash);

    if (!value) {
      console.log(`Please sign up! No user found for "${email}".`);
      return;
    }

    this.loggedIn = true;
    console.log('Logged in as "' + email + '"');
  }

  logout() {
    this.loggedIn = false;
    console.log('Logged out');
  }
}

export { SessionUseCase };
