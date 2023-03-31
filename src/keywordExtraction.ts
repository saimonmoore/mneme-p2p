type MnemeTopic = {
  label: string;
  wikiLink: string;
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

async function analyzeURLForKeywords(url: string, numOfKeywords = 10) {
  const apiKey: string | undefined = process.env.TEXTRAZOR_API_KEY;

  type TextRazorHeaders = {
    'Content-Type': string;
    'x-textrazor-key'?: string;
  };

  const headers: TextRazorHeaders = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['x-textrazor-key'] = apiKey || 'secret';
  }

  const response = await fetch('https://api.textrazor.com', {
    method: 'POST',
    headers,
    body: `url=${encodeURIComponent(url)}&extractors=entities,topics`,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const error = data.error;

  if (error) {
    return { error };
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

  const keywords = data.response.topics
    .sort((a: TextRazorTopic, b: TextRazorTopic) => b.score - a.score)
    .slice(0, numOfKeywords)
    .map((topic: TextRazorTopic) => ({
      label: topic.label,
      wikiLink: topic.wikiLink,
    }));

  const tags = data.response.coarseTopics
    .sort((a: TextRazorTopic, b: TextRazorTopic) => b.score - a.score)
    .slice(0, numOfKeywords)
    .map((topic: TextRazorTopic) => ({
      label: topic.label,
      wikiLink: topic.wikiLink,
    }));

  const entities = data.response.entities
    .sort(
      (a: TextRazorEntity, b: TextRazorEntity) =>
        b.relevanceScore - a.relevanceScore
    )
    .slice(0, numOfKeywords)
    .map((entity: TextRazorEntity) => ({
      label: entity.entityEnglishId,
      wikiLink: entity.wikiLink,
    }));

  return {
    keywords: removeDuplicateLabels(keywords),
    tags: removeDuplicateLabels(tags),
    entities: removeDuplicateLabels(entities),
    language: data.response.language,
  };
}

const url = process.argv[2];

if (!url) {
  console.error('Please provide a url as an argument');
  process.exit(1);
}

const result = await analyzeURLForKeywords(url, 10);

if (result?.error) {
  console.error('==============> BOOM: ', { error: result.error });
  process.exit(1);
}

const { keywords, entities, tags, language } = result;

console.log(' ================> DATA: ', {
  keywords,
  entities,
  tags,
  language,
});
