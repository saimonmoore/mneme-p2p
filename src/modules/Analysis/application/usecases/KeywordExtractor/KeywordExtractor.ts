import { DEFAULT_NUMBER_OF_KEYWORDS } from '#config/constants.js';
import { logger } from '#infrastructure/logging/index.js';
import { analyzeURLOrTextForKeywords } from '#Analysis/application/usecases/KeywordExtractor/TextRazorExtractor.js';
import { MnemeTopic } from '#Record/domain/entities/record.js';
import { FetchResponse } from '#infrastructure/http/request.js';

type MnemeLanguage = 'eng' | 'spa' | 'ell' | 'cat';

type MnemeKeywords = {
  keywords: MnemeTopic[];
  tags: MnemeTopic[];
  entities: MnemeTopic[];
  language: MnemeLanguage;
};

export async function extractKeywordsForTextOrUrl(
  url?: string,
  text?: string,
  numOfKeywords = DEFAULT_NUMBER_OF_KEYWORDS
): Promise<MnemeKeywords | FetchResponse<unknown>> {
  if (!url && !text) {
    logger.error('Please provide either a url or some text as an argument');
    return { error: 'Please provide either a url or some text as an argument' };
  }

  if (!numOfKeywords) numOfKeywords = DEFAULT_NUMBER_OF_KEYWORDS;

  return (await analyzeURLOrTextForKeywords(
    url,
    text,
    numOfKeywords
  )) as MnemeKeywords;
}
