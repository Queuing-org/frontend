export function formatListeningDuration(
  listeningDurationSeconds: number | null | undefined,
) {
  if (
    typeof listeningDurationSeconds !== "number" ||
    !Number.isFinite(listeningDurationSeconds) ||
    listeningDurationSeconds < 0
  ) {
    return "-";
  }

  const totalMinutes = Math.floor(listeningDurationSeconds / 60);

  if (totalMinutes === 0) {
    return listeningDurationSeconds === 0 ? "0분" : "1분 미만";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}분`;
  }

  if (minutes === 0) {
    return `${hours}시간`;
  }

  return `${hours}시간 ${minutes}분`;
}
