import { OPERATIONS } from '../../../../../constants.js';

class VoteUseCase {
  constructor(bee, autobase, session) {
    this.bee = bee;
    this.autobase = autobase;
    this.session = session;
  }

  async upvote(hash) {
    await this.autobase.append(
      JSON.stringify({
        type: OPERATIONS.VOTE,
        hash,
        up: true,
      })
    );
  }

  async downvote(hash) {
    await this.autobase.append(
      JSON.stringify({
        type: OPERATIONS.VOTE,
        hash,
        up: false,
      })
    );
  }
}

export { VoteUseCase };
