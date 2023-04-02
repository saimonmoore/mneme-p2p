import { categorizeUrlViaMicrolink } from './MicrolinkUrlCategorizer.js';

export enum MnemePublishers {
  GitHub = 'GitHub',
  Wikipedia = 'Wikipedia',
  YouTube = 'YouTube',
  Twitter = 'Twitter',
  Instagram = 'Instagram',
}

export type UrlCategorization = {
  publisher?: string;
  title?: string;
  description?: string;
  image?: string;
  logo?: string;
  language?: string;
};

export async function categorizeUrl(url: string): Promise<UrlCategorization> {
  return categorizeUrlViaMicrolink(url);
}
