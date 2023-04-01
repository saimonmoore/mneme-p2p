import { DEFAULT_NUMBER_OF_KEYWORDS } from '#config/constants.js';
import { logger } from '#infrastructure/logging/index.js';
import { analyzeURLForKeywords } from '#Analysis/application/usecases/KeywordExtractor/TextRazorExtractor.js';
import { MnemeTopic } from '#Record/domain/entities/record.js';
import { FetchResponse } from '#infrastructure/http/request.js';

type MnemeLanguage = 'eng' | 'spa' | 'ell' | 'cat';

type MnemeKeywords = {
  keywords: MnemeTopic[];
  tags: MnemeTopic[];
  entities: MnemeTopic[];
  language: MnemeLanguage;
};

export async function extractKeywordsForUrl(
  url: string,
  numOfKeywords = DEFAULT_NUMBER_OF_KEYWORDS
): Promise<MnemeKeywords | FetchResponse<unknown>> {
  if (!url) {
    logger.error('Please provide a url as an argument');
    return { error: 'Please provide a url as an argument' };
  }

  if (!numOfKeywords) numOfKeywords = DEFAULT_NUMBER_OF_KEYWORDS;

  return (await analyzeURLForKeywords(url, numOfKeywords)) as MnemeKeywords;
}
