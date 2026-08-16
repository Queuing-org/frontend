export type ChatContentSegment =
  | { text: string; type: "text" }
  | { seconds: number; text: string; type: "timestamp" };

const CHAT_TIMESTAMP_PATTERN =
  /(^|[^\d:])((?:(\d{1,2}):)?(\d{1,2}):([0-5]\d))(?![\d:])/g;

export function getChatContentSegments(content: string): ChatContentSegment[] {
  const segments: ChatContentSegment[] = [];
  let contentIndex = 0;

  for (const match of content.matchAll(CHAT_TIMESTAMP_PATTERN)) {
    const matchIndex = match.index;
    const boundary = match[1] ?? "";
    const timestampText = match[2];
    const hoursText = match[3];
    const minutesText = match[4];
    const secondsText = match[5];

    if (
      matchIndex === undefined ||
      !timestampText ||
      !minutesText ||
      !secondsText
    ) {
      continue;
    }

    const minutes = Number(minutesText);
    if (hoursText !== undefined && minutes >= 60) {
      continue;
    }

    const timestampIndex = matchIndex + boundary.length;
    if (timestampIndex > contentIndex) {
      segments.push({
        text: content.slice(contentIndex, timestampIndex),
        type: "text",
      });
    }

    segments.push({
      seconds:
        (hoursText ? Number(hoursText) * 60 * 60 : 0) +
        minutes * 60 +
        Number(secondsText),
      text: timestampText,
      type: "timestamp",
    });
    contentIndex = timestampIndex + timestampText.length;
  }

  if (contentIndex < content.length) {
    segments.push({ text: content.slice(contentIndex), type: "text" });
  }

  return segments.length > 0 ? segments : [{ text: content, type: "text" }];
}
