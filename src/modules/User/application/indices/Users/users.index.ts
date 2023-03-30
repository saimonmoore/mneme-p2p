import camelcase from 'camelcase';
import type { BeeBatch } from '../../../../../@types/global.d.ts';

import { User } from '../../../domain/entities/user.js';

export const USERS_KEY = 'org.mneme.users!';
export const FRIENDS_KEY = (userHash: string) => `${USERS_KEY}${userHash}!org.mneme.friends!`;
export const FRIENDS_BY_NAME_KEY = (userHash: string) => `${USERS_KEY}${userHash}!org.mneme.friendsByName!`;
export const FRIENDS_BY_EMAIL_KEY = (userHash: string) => `${USERS_KEY}${userHash}!org.mneme.friendsByEmail!`;

type UserOperation = {
  hash: string;
  user: User;
  friend?: User;
};

// All users in system
export async function indexUsers(batch: BeeBatch, operation: UserOperation) {
  const { hash, user } = operation;
  await batch.put(USERS_KEY + hash, { hash, user });
}

export async function indexFriends(batch: BeeBatch, operation: UserOperation) {
  const { hash, friend, user } = operation;

  if (!friend) {
    console.error('friend is undefined');
    return;
  }

  // value is hash to user
  await batch.put(FRIENDS_KEY(user.hash as string) + hash, hash);

  // index by displayName
  await batch.put(FRIENDS_BY_NAME_KEY(user.hash as string) + camelcase(friend.displayName as string), hash);

  // index by email
  await batch.put(FRIENDS_BY_EMAIL_KEY(user.hash as string) + camelcase(friend.email as string), hash);
}
