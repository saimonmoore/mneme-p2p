import lexint from 'lexicographic-integer';
import { sha256 } from '../../../../Shared/infrastructure/helpers/hash.js';

export const POSTS_KEY = 'org.mneme.posts!';
export const TOP_POSTS_KEY = 'org.mneme.topPosts!';

export async function indexPosts(batch, operation) {
  console.log('indexRecords =========> ', { operation });
  const hash = sha256(operation.data);
  await batch.put(POSTS_KEY + hash, { hash, votes: 0, data: operation.data });
  await batch.put(
    TOP_POSTS_KEY + lexint.pack(0, 'hex') + '!' + operation.hash,
    operation.hash
  );
}

export async function indexPostVotes(batch, operation, bee) {
  const inc = operation.up ? 1 : -1;
  const post = await bee.get(POSTS_KEY + operation.hash, { update: false });

  if (!post) return;

  await batch.del(
    TOP_POSTS_KEY + lexint.pack(post.value.votes, 'hex') + '!' + operation.hash
  );
  post.value.votes += inc;
  await batch.put(POSTS_KEY + operation.hash, post.value);
  await batch.put(
    TOP_POSTS_KEY + lexint.pack(post.value.votes, 'hex') + '!' + operation.hash,
    operation.hash
  );
}
