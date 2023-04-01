import { MnemeTopic } from '#Record/domain/entities/record.js';
import { logger } from '#infrastructure/logging/index.js';
import { request } from '#infrastructure/http/index.js';

type TextRazorHeaders = {
  'Content-Type': string;
  'x-textrazor-key'?: string;
};

type TextRazorLanguage = 'eng' | 'spa' | 'ell' | 'cat';

type TextRazorResponse = {
  language: TextRazorLanguage;
  topics: {
    label: string;
    wikiLink: string;
    score: number;
  }[];
  coarseTopics: {
    label: string;
    wikiLink: string;
    score: number;
  }[];
  entities: {
    relevanceScore: number;
    wikiLink: string;
    entityEnglishId: string;
  }[];
};

const correctWikiLinks = (url: string) => {
  const CATEGORY_WIKI_URL = 'http://en.wikipedia.org/Category:';
  const WIKIPEDIA_URL = 'http://en.wikipedia.org/';
  const WIKI_URL = 'http://en.wikipedia.org/wiki/';

  if (url.startsWith(CATEGORY_WIKI_URL)) {
    return url.replace(CATEGORY_WIKI_URL, WIKI_URL);
  }

  if (!url.startsWith(WIKI_URL)) {
    return url.replace(WIKIPEDIA_URL, WIKI_URL);
  }

  return url;
};

const removeDuplicateLabels = (arr: MnemeTopic[]) => {
  const labels = new Set();
  return arr.filter((obj) => {
    if (labels.has(obj.label)) {
      return false;
    } else {
      labels.add(obj.label);
      return true;
    }
  });
};

export async function analyzeURLForKeywords(
  url: string,
  numOfKeywords: number
) {
  const apiKey: string | undefined = process.env.TEXTRAZOR_API_KEY;

  if (!apiKey) {
    logger.error('Please provide a TextRazor API key');
    return { error: 'Please provide a TextRazor API key' };
  }

  const headers: TextRazorHeaders = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['x-textrazor-key'] = apiKey || 'secret';
  }

  const response = await request<TextRazorResponse>(
    'https://api.textrazor.com',
    {
      method: 'POST',
      headers,
      body: `url=${encodeURIComponent(url)}&extractors=entities,topics`,
    }
  );

  const error = response.error;

  if (error) {
    return { error };
  }

  const data = response.data;

  if (!data) {
    return { error: 'No data returned from TextRazor' };
  }

  type TextRazorTopic = {
    score: number;
    label: string;
    wikiLink: string;
  };

  type TextRazorEntity = {
    relevanceScore: number;
    entityEnglishId: string;
    wikiLink: string;
  };

  const keywords = data.topics
    .sort((a: TextRazorTopic, b: TextRazorTopic) => b.score - a.score)
    .slice(0, numOfKeywords)
    .map((topic: TextRazorTopic) => ({
      label: topic.label,
      wikiLink: correctWikiLinks(topic.wikiLink),
    }));

  const tags = data.coarseTopics
    .sort((a: TextRazorTopic, b: TextRazorTopic) => b.score - a.score)
    .slice(0, numOfKeywords)
    .map((topic: TextRazorTopic) => ({
      label: topic.label,
      wikiLink: correctWikiLinks(topic.wikiLink),
    }));

  const entities = data.entities
    .sort(
      (a: TextRazorEntity, b: TextRazorEntity) =>
        b.relevanceScore - a.relevanceScore
    )
    .slice(0, numOfKeywords)
    .map((entity: TextRazorEntity) => ({
      label: entity.entityEnglishId,
      wikiLink: correctWikiLinks(entity.wikiLink),
    }));

  return {
    keywords: removeDuplicateLabels(keywords),
    tags: removeDuplicateLabels(tags),
    entities: removeDuplicateLabels(entities),
    language: data.language,
  };
}
