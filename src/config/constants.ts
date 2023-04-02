export enum OPERATIONS {
  ADD_FRIEND = 'addFriend',
  CREATE_USER = 'createUser',
  RECORD = 'record',
}

export const DEFAULT_NUMBER_OF_KEYWORDS = 10;

export const APIFY_TOKEN = process.env.APIFY_TOKEN;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const TEXTRAZOR_API_KEY = process.env.TEXTRAZOR_API_KEY;
