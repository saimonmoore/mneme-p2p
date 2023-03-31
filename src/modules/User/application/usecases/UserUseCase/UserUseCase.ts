import Autobase from 'autobase';
import Hyperbee from 'hyperbee';

import camelcase from 'camelcase';
import { sha256 } from '#Shared/infrastructure/helpers/hash.js';

import { OPERATIONS } from '#config/constants.js';
import {
  USERS_KEY,
  FRIENDS_KEY,
  FRIENDS_BY_NAME_KEY,
  FRIENDS_BY_EMAIL_KEY,
} from '#User/application/indices/Users/users.index.js';
import { SessionUseCase } from '#Session/application/usecases/SessionUseCase/SessionUseCase.js';
import { sessionRequired } from '#Session/application/decorators/sessionRequired.js';
import { UserEntity } from '#User/domain/entities/user.js';
import { logger } from '#infrastructure/logging/index.js';

import type { User } from '#User/domain/entities/user.js';

class UserUseCase {
  bee: Hyperbee;
  autobase: Autobase;
  session: SessionUseCase;

  constructor(bee: Hyperbee, autobase: Autobase, session: SessionUseCase) {
    this.bee = bee;
    this.autobase = autobase;
    this.session = session;
  }

  // /userHash/friends/userHash
  // /userHash/friends/EnricoStano
  // /userHash/friends/enrico@stano.org

  @sessionRequired
  async *users() {
    // @ts-ignore
    for await (const data of this.bee.createReadStream({
      gt: USERS_KEY,
      lt: `${USERS_KEY}~`,
    })) {
      yield UserEntity.create(data.value.user as User);
    }
  }

  @sessionRequired
  async *friends() {
    const currentUserHash = this.session.currentUser?.hash;

    // @ts-ignore
    for await (const data of this.bee.createReadStream({
      gt: FRIENDS_KEY(currentUserHash as string),
      lt: `${FRIENDS_KEY(currentUserHash as string)}~`,
    })) {
      const hash = data.value;
      const entry = await this.bee.get(USERS_KEY + hash);

      yield UserEntity.create(entry.value.user);
    }
  }

  // /userHash/friends/EnricoStano
  // /userHash/friends/Enr

  @sessionRequired
  async *friendsByName(text: string) {
    const currentUserHash = this.session.currentUser?.hash;

    // @ts-ignore
    for await (const data of this.bee.createReadStream({
      gte: FRIENDS_BY_NAME_KEY(currentUserHash as string) + camelcase(text),
      lt:
        FRIENDS_BY_NAME_KEY(currentUserHash as string) + camelcase(text) + '~',
      limit: 10,
    })) {
      const hash = data.value;
      const entry = await this.bee.get(USERS_KEY + hash);

      yield UserEntity.create(entry.value.user);
    }
  }

  @sessionRequired
  async *friendsByEmail(text: string) {
    const currentUserHash = this.session.currentUser?.hash;

    // @ts-ignore
    for await (const data of this.bee.createReadStream({
      gt: FRIENDS_BY_EMAIL_KEY(currentUserHash as string) + camelcase(text),
      lt:
        FRIENDS_BY_EMAIL_KEY(currentUserHash as string) + camelcase(text) + '~',
      limit: 10,
    })) {
      const hash = data.value;
      const entry = await this.bee.get(USERS_KEY + hash);

      yield UserEntity.create(entry.value.user);
    }
  }

  async signup(user: User) {
    const hash = sha256(user.email);

    logger.info(`Signing up with: ${user.email}`);

    const value = await this.bee.get(USERS_KEY + hash);

    if (value) {
      logger.info(`User already exists with "${user.email}".`);
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

    this.session.directLogin(loggedInUser);

    logger.info(`Created user for "${loggedInUser.email}".`);
  }

  @sessionRequired
  async addFriend(hash: string) {
    const entry = await this.bee.get(USERS_KEY + hash);

    if (!entry) {
      logger.info(`User does not exist with "${hash}".`);
      return;
    }

    const friend = entry.value?.user;

    await this.autobase.append(
      JSON.stringify({
        type: OPERATIONS.ADD_FRIEND,
        friend,
        user: this.session.currentUser,
        hash,
      })
    );

    logger.info(`Added user "${friend.email}" as your friend.`);
  }
}

export { UserUseCase };
