class VoteUseCase {
  constructor(bee, autobase) {
    this.bee = bee;
    this.autobase = autobase;
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
