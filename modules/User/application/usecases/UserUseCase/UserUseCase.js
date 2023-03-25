import { sha256 } from '../../../../Shared/infrastructure/helpers/hash.js';

class UserUseCase {
  constructor(bee, autobase, sessionUseCase) {
    this.bee = bee;
    this.autobase = autobase;
    this.sessionUseCase = sessionUseCase;
  }

  async *users() {
    for await (const data of this.bee.createReadStream({
      gt: 'users!',
      lt: 'users!~',
    })) {
      yield data.value;
    }
  }

  async signup(email) {
    const hash = sha256(email);

    console.debug(`Signing up with: ${email}`);

    const value = await this.bee.get('users!' + hash);

    if (value) {
      console.log(`User already exists with "${email}".`);
      return;
    }

    await this.autobase.append(
      JSON.stringify({
        type: 'createUser',
        data: { email },
        hash,
      })
    );

    this.sessionUseCase.directLogin(email);

    console.log(`Created user for "${email}".`);
  }
}

export { UserUseCase };
