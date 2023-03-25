class PostUseCase {
  constructor(bee, autobase) {
    this.bee = bee;
    this.autobase = autobase;
  }

  async *posts() {
    for await (const data of this.bee.createReadStream({
      gt: 'posts!',
      lt: 'posts!~',
    })) {
      yield data.value;
    }
  }

  async *topPosts() {
    for await (const data of this.bee.createReadStream({
      gt: 'top!',
      lt: 'top!~',
      reverse: true,
    })) {
      const { value } = await this.bee.get('posts!' + data.value);
      yield value;
    }
  }

  async post(data) {
    await this.autobase.append(
      JSON.stringify({
        type: 'post',
        data,
      })
    );

    console.log('Posted: ' + data);
  }
}

export { PostUseCase };
