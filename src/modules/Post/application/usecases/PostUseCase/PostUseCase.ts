import { POSTS_KEY, TOP_POSTS_KEY } from '../../indices/Posts/posts.index.js';
import { OPERATIONS } from '../../../../../constants.js';

class PostUseCase {
  constructor(bee, autobase, session) {
    this.bee = bee;
    this.autobase = autobase;
    this.session = session;
  }

  async *posts() {
    for await (const data of this.bee.createReadStream({
      gt: POSTS_KEY,
      lt: `${POSTS_KEY}~`,
    })) {
      yield data.value;
    }
  }

  async *topPosts() {
    for await (const data of this.bee.createReadStream({
      gt: TOP_POSTS_KEY,
      lt: `${TOP_POSTS_KEY}~`,
      reverse: true,
    })) {
      const { value } = await this.bee.get(POSTS_KEY + data.value);
      yield value;
    }
  }

  async post(data) {
    await this.autobase.append(
      JSON.stringify({
        type: OPERATIONS.POST,
        data,
      })
    );

    console.log('Posted: ' + data);
  }
}

export { PostUseCase };
