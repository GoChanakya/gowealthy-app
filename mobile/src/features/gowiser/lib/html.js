/**
 * HTML parsing for GoWiser articles.
 *
 * Articles are authored in a web CMS and stored as raw HTML (`body`) plus a
 * separate `mcqHtml` blob that still carries the browser widget's inline
 * onclick handlers. Nothing here touches React — pure string -> data, so it
 * can be unit tested without a renderer.
 */

/** Strip tags/entities down to readable text, preserving paragraph breaks. */
export function cleanHtmlContent(html) {
  if (!html) return '';
  return html
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<h3[^>]*>/gi, '\n')
    .replace(/<\/h3>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/  +/g, ' ')
    .replace(/\n\n+/g, '\n\n')
    .trim();
}

/**
 * Split an article body into `{ title, parts }` sections, one per <h2>.
 * Returns [] when the body has no <h2> — callers fall back to paragraph chunks.
 */
export function extractSections(html) {
  if (!html) return [];
  const matches = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
  return matches.map((match, index) => {
    const startIndex = match.index + match[0].length;
    const endIndex = matches[index + 1]?.index ?? html.length;
    return {
      title: cleanHtmlContent(match[1]),
      parts: parseContentWithFormatting(html.substring(startIndex, endIndex)),
    };
  });
}

/**
 * Turn a chunk of body HTML into styled text runs:
 * `{ text, bold | italic | heading | normal }`.
 * Lists are flattened to bulleted/numbered lines first.
 */
export function parseContentWithFormatting(html) {
  let tempHtml = html;

  tempHtml = tempHtml.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
    const items = content.match(/<li[^>]*>(.*?)<\/li>/gi);
    if (!items) return match;
    return '\n' + items.map((i) => '• ' + i.replace(/<li[^>]*>|<\/li>/gi, '').trim()).join('\n');
  });

  tempHtml = tempHtml.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
    const items = content.match(/<li[^>]*>(.*?)<\/li>/gi);
    if (!items) return match;
    return (
      '\n' +
      items.map((it, idx) => `${idx + 1}. ` + it.replace(/<li[^>]*>|<\/li>/gi, '').trim()).join('\n')
    );
  });

  const segments = tempHtml.split(/(<(?:strong|b|em|i|h3)[^>]*>.*?<\/(?:strong|b|em|i|h3)>)/gi);

  const parts = [];
  segments.forEach((segment) => {
    if (!segment || !segment.trim()) return;
    const text = cleanHtmlContent(segment);
    if (!text) return;

    if (/<(strong|b)>(.*?)<\/(strong|b)>/i.test(segment)) parts.push({ text, bold: true });
    else if (/<(em|i)>(.*?)<\/(em|i)>/i.test(segment)) parts.push({ text, italic: true });
    else if (/<h3>(.*?)<\/h3>/i.test(segment)) parts.push({ text, heading: true });
    else parts.push({ text, normal: true });
  });

  return parts;
}

/**
 * Recover MCQs from the CMS's quiz markup.
 *
 * Brittle by nature: the correct answer only exists inside the widget's
 * `onclick="checkAnswer(this, true)"` attribute, and questions are delimited by
 * the literal `<div style=` the editor emits. If the CMS ever moves to
 * structured MCQ data, prefer that and keep this as the legacy fallback.
 */
export function extractMCQs(mcqHtml) {
  if (!mcqHtml) return [];
  const mcqs = [];

  mcqHtml.split('<div style=').forEach((block) => {
    const questionMatch = block.match(/<p[^>]*>(.*?)<\/p>/i);
    const answerFlags = [...block.matchAll(/onclick="checkAnswer\(this,\s*(true|false)/gi)];
    const buttonTexts = [...block.matchAll(/<button[^>]*>([^<]+)<\/button>/gi)];

    if (!questionMatch || buttonTexts.length === 0) return;

    mcqs.push({
      question: questionMatch[1].replace(/<[^>]*>/g, ''),
      options: buttonTexts.map((btn, i) => ({
        text: btn[1].trim(),
        isCorrect: answerFlags[i]?.includes('true') || false,
      })),
    });
  });

  return mcqs;
}

export function getYouTubeVideoId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : null;
}
