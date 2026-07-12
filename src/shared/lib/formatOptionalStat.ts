export function formatOptionalStat(value: number | undefined) {
  return typeof value === "number" ? value.toLocaleString("ko-KR") : "-";
}
