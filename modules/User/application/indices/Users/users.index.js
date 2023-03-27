import camelcase from 'camelcase';

export const USERS_KEY = 'org.mneme.users!';
export const FRIENDS_KEY = (userHash) => `${USERS_KEY}${userHash}!org.mneme.friends!`;
export const FRIENDS_BY_NAME_KEY = (userHash) => `${USERS_KEY}${userHash}!org.mneme.friendsByName!`;
export const FRIENDS_BY_EMAIL_KEY = (userHash) => `${USERS_KEY}${userHash}!org.mneme.friendsByEmail!`;

// All users in system
export async function indexUsers(batch, operation) {
  const { hash, user } = operation;
  await batch.put(USERS_KEY + hash, { hash, user });
}

export async function indexFriends(batch, operation) {
  const { hash, friend, user } = operation;

  // value is hash to user
  await batch.put(FRIENDS_KEY(user.hash) + hash, hash);

  // index by displayName
  await batch.put(FRIENDS_BY_NAME_KEY(user.hash) + camelcase(friend.displayName), hash);

  // index by email
  await batch.put(FRIENDS_BY_EMAIL_KEY(user.hash) + camelcase(friend.email), hash);
}
