class VoteUseCase {
  constructor(bee, autobase, session) {
    this.bee = bee;
    this.autobase = autobase;
    this.session = session;
  }

  async upvote(hash) {
    await this.autobase.append(
      JSON.stringify({
        type: 'vote',
        hash,
        up: true,
      })
    );
  }

  async downvote(hash) {
    await this.autobase.append(
      JSON.stringify({
        type: 'vote',
        hash,
        up: false,
      })
    );
  }
}

export { VoteUseCase };
