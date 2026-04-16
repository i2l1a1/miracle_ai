const ANSWER_PREVIEW_MAX_LEN = 220;

export const truncateText = (text: string, maxLen: number = 220) => {
  const normalized = text.trim();
  if (normalized.length <= maxLen) return text;
  return `${normalized.slice(0, maxLen).trimEnd()}...`;
};

