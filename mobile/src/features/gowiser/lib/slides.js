import { cleanHtmlContent, extractSections, extractMCQs } from './html';

export const SLIDE_TYPE = {
  INTRO: 'intro',
  CONTENT: 'content',
  SOCIAL: 'social',
  MCQ: 'mcq',
  END: 'end',
};

/** Paragraphs per slide when an article body has no <h2> to split on. */
const FALLBACK_CHUNK_SIZE = 3;

/**
 * Turn an article document into the ordered story deck:
 * intro -> N content -> social? -> mcq? -> end
 */
export function buildSlides(article) {
  if (!article) return [];

  const slides = [
    {
      type: SLIDE_TYPE.INTRO,
      content: {
        title: article.title,
        description: article.description,
        image: article.titleImage,
        author: article.author?.name || 'Admin',
        minRead: article.minRead,
        category: article.category,
      },
    },
  ];

  const sections = extractSections(article.body);

  if (sections.length > 0) {
    sections.forEach((section) => slides.push({ type: SLIDE_TYPE.CONTENT, content: section }));
  } else {
    const paragraphs = cleanHtmlContent(article.body)
      .split('\n\n')
      .filter((p) => p.trim().length > 0);

    for (let i = 0; i < paragraphs.length; i += FALLBACK_CHUNK_SIZE) {
      slides.push({
        type: SLIDE_TYPE.CONTENT,
        content: {
          title: '',
          parts: paragraphs.slice(i, i + FALLBACK_CHUNK_SIZE).map((text) => ({ text, normal: true })),
        },
      });
    }
  }

  if (article.socialMediaPosts?.length > 0) {
    slides.push({ type: SLIDE_TYPE.SOCIAL, content: article.socialMediaPosts });
  }

  const mcqs = extractMCQs(article.mcqHtml);
  if (mcqs.length > 0) {
    slides.push({ type: SLIDE_TYPE.MCQ, content: mcqs });
  }

  slides.push({
    type: SLIDE_TYPE.END,
    content: { xp: article.xp, tags: article.tags || [] },
  });

  return slides;
}
