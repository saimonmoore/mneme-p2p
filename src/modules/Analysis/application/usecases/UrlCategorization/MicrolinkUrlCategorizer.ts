import mql from '@microlink/mql';

import type { MqlResponse } from '@microlink/mql';
import { MnemePublishers } from '#Analysis/application/usecases/UrlCategorization/UrlCategorizer.js';
import type { UrlCategorization } from '#Analysis/application/usecases/UrlCategorization/UrlCategorizer.js';

function callMicroLink(url: string): Promise<MqlResponse> {
  return mql(url);
}

function correctPublisher(publisher?: string): string | undefined {
  if (!publisher) return;

  if (publisher === 'Wikimedia Foundation, Inc.') {
    return MnemePublishers.Wikipedia;
  }

  return publisher;
}

export async function categorizeUrlViaMicrolink(
  url: string
): Promise<UrlCategorization> {
  const { data } = await callMicroLink(url);

  return {
    publisher: correctPublisher(data.publisher || undefined),
    title: data.title || undefined,
    description: data.description || undefined,
    image: data.image?.url || undefined,
    logo: data.logo?.url || undefined,
    language: data.lang || undefined,
  };
}
