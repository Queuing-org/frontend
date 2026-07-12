export const CHAT_REPORT_REASONS = [
  "욕설 및 비방",
  "스팸 및 도배",
  "음란하거나 불쾌한 내용",
  "기타 부적절한 내용",
] as const;

export type ChatReportReason = (typeof CHAT_REPORT_REASONS)[number];

export function buildChatReportReason(
  selectedReasons: ReadonlySet<ChatReportReason>,
) {
  return CHAT_REPORT_REASONS.filter((reason) => selectedReasons.has(reason)).join(
    "\n",
  );
}
