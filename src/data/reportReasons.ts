export const REPORT_REASONS = ["스팸/광고", "불법 정보", "욕설/혐오", "사기 의심", "기타"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
