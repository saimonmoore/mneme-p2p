import camelcase from 'camelcase';
import { sha256 } from '../../../../Shared/infrastructure/helpers/hash.js';
import { OPERATIONS } from '../../../../../constants.js';
import { USERS_KEY, FRIENDS_KEY, FRIENDS_BY_NAME_KEY, FRIENDS_BY_EMAIL_KEY } from '../../indices/Users/users.index.js';

class UserUseCase {
  constructor(bee, autobase, sessionUseCase) {
    this.bee = bee;
    this.autobase = autobase;
    this.sessionUseCase = sessionUseCase;
  }

  // /userHash/friends/userHash
  // /userHash/friends/EnricoStano
  // /userHash/friends/enrico@stano.org

  // TODO: Only for logged in users
  async *users() {
    for await (const data of this.bee.createReadStream({
      gt: USERS_KEY,
      lt: `${USERS_KEY}~`,
    })) {
      yield data.value;
    }
  }

  // TODO: Only for logged in users
  async *friends() {
    const currentUserHash = this.sessionUseCase.currentUser.hash;

    for await (const data of this.bee.createReadStream({
      gt: FRIENDS_KEY(currentUserHash),
      lt: `${FRIENDS_KEY(currentUserHash)}~`,
    })) {
      const hash = data.value;
      const entry = await this.bee.get(USERS_KEY + hash);

      yield entry.value.user;
    }
  }

  // TODO: Only for logged in users
  // /userHash/friends/EnricoStano
  // /userHash/friends/Enr
  async *friendsByName(text) {
    const currentUserHash = this.sessionUseCase.currentUser.hash;

    for await (const data of this.bee.createReadStream({
      gte: FRIENDS_BY_NAME_KEY(currentUserHash) + camelcase(text),
      lt: FRIENDS_BY_NAME_KEY(currentUserHash) + camelcase(text) + '~',
      limit: 10,
    })) {
      const hash = data.value;
      const entry = await this.bee.get(USERS_KEY + hash);

      yield entry.value.user;
    }
  }

  // TODO: Only for logged in users
  async *friendsByEmail(text) {
    const currentUserHash = this.sessionUseCase.currentUser.hash;

    for await (const data of this.bee.createReadStream({
      gt: FRIENDS_BY_EMAIL_KEY(currentUserHash) + camelcase(text),
      lt: FRIENDS_BY_EMAIL_KEY(currentUserHash) + camelcase(text) + '~',
      limit: 10,
    })) {
      const hash = data.value;
      const entry = await this.bee.get(USERS_KEY + hash);

      yield entry.value.user;
    }
  }

  async signup(user) {
    const hash = sha256(user.email);

    console.debug(`Signing up with: ${user.email}`);

    const value = await this.bee.get(USERS_KEY + hash);

    if (value) {
      console.log(`User already exists with "${user.email}".`);
      return;
    }

    const loggedInUser = { ...user, hash };

    await this.autobase.append(
      JSON.stringify({
        type: OPERATIONS.CREATE_USER,
        user: loggedInUser,
        hash,
      })
    );

    this.sessionUseCase.directLogin(loggedInUser);

    console.log(`Created user for "${loggedInUser.email}".`);
  }

  // TODO: Only for logged in users
  async addFriend(hash) {
    console.debug(`Adding friend with hash: ${hash}`);

    const entry = await this.bee.get(USERS_KEY + hash);

    if (!entry) {
      console.log(`User does not exist with "${hash}".`);
      return;
    }

    const friend = entry.value?.user;

    console.debug(`Adding friend ===> : `, { friend });

    await this.autobase.append(
      JSON.stringify({
        type: OPERATIONS.ADD_FRIEND,
        friend,
        user: this.sessionUseCase.currentUser,
        hash,
      })
    );

    console.log(`Added user "${friend.email}" as your friend.`);
  }
}

export { UserUseCase };
