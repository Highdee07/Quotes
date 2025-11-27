import { Quote } from '../types';

export const parseQuotes = (rawText: string): Quote[] => {
  // Normalize line endings
  const normalized = rawText.replace(/\r\n/g, '\n');
  
  // Split by double newlines (paragraphs)
  const blocks = normalized.split(/\n\n+/).filter(b => b.trim().length > 0);

  return blocks.map((block, index) => {
    const trimmed = block.trim();
    
    // Attempt to extract author using common patterns
    // Look for patterns like: "Quote text" - Author Name OR Quote text - Author Name
    // We look for a dash or em-dash near the end of the string
    const authorRegex = /[\u2014\u2013-]\s*([A-Za-z\s\.]+)(\s*)$/;
    const match = trimmed.match(authorRegex);

    let text = trimmed;
    let author = null;

    if (match && match[1]) {
      // Check if the captured group looks like a name (not too long)
      if (match[1].length < 50) {
        author = match[1].trim();
        text = trimmed.replace(authorRegex, '').trim();
      }
    }

    // Clean up quotes surrounding the text if they exist
    text = text.replace(/^["“]|["”]$/g, '').trim();

    return {
      id: `q-${index}-${Date.now()}`,
      text,
      author
    };
  });
};
