import { apifyTwitterScraper } from './apifyTwitterScraper.js';

export type ScraperOutput = {
  content: string;
  urls: string[];
};

export async function twitterScraper(url: string): Promise<ScraperOutput> {
  return await apifyTwitterScraper(url);
}
