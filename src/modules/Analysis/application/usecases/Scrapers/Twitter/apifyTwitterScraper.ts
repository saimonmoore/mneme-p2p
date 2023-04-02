// @ts-ignore
import { ApifyClient } from 'apify-client';
// @ts-ignore
import extractUrls from 'extract-urls';

import { APIFY_TOKEN } from '#config/constants.js';

import type { ScraperOutput } from '#Analysis/application/usecases/Scrapers/Twitter/twitterScraper.js';

// Initialize the ApifyClient with API token
const client = new ApifyClient({
  token: APIFY_TOKEN,
});

type ApifyMedia = {
  type: string;
  url: string;
};

type ApifyTwitterScraperOutput = {
  media: ApifyMedia[];
  full_text: string;
  url: string;
};

// Prepare actor input
const input = (url: string) => ({
  addTweetViewCount: false,
  addUserInfo: false,
  browserFallback: false,
  debugLog: false,
  extendOutputFunction:
    'async ({ data, item, page, request, customData, Apify }) => {\n  return item;\n}',
  extendScraperFunction:
    'async ({ page, request, addSearch, addProfile, _, addThread, addEvent, customData, Apify, signal, label }) => {\n \n}',
  handlePageTimeoutSecs: 500,
  maxIdleTimeoutSecs: 60,
  maxRequestRetries: 6,
  mode: 'replies',
  profilesDesired: 1,
  proxyConfig: {
    useApifyProxy: true,
  },
  searchMode: 'live',
  startUrls: [
    {
      url,
    },
  ],
  tweetsDesired: 5,
  useAdvancedSearch: false,
  useCheerio: true,
});

export async function apifyTwitterScraper(url: string): Promise<ScraperOutput> {
  // Run the actor and wait for it to finish
  const run = await client.actor('quacker/twitter-scraper').call(input(url));

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  const urls: string[] = [];

  return items.inject((content: string, item: ApifyTwitterScraperOutput) => {
    if (item.full_text && item.full_text.length) {
      urls.concat(...extractUrls(item.full_text));
      content += `item.full_text\n`;
    }

    return { content, urls };
  }, '');
}
