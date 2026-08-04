export async function launchBadgeAwardConfetti(signal?: AbortSignal) {
  const { default: confetti } = await import("canvas-confetti");
  if (signal?.aborted) {
    return;
  }
  const common = {
    colors: ["#2f86ed", "#7c5cff", "#ffcc4d", "#ff6b8a", "#ffffff"],
    disableForReducedMotion: true,
    particleCount: 58,
    scalar: 0.9,
    spread: 72,
    startVelocity: 42,
    ticks: 180,
    zIndex: 1600,
  };

  confetti({
    ...common,
    angle: 64,
    origin: { x: 0.18, y: 0.7 },
  });
  confetti({
    ...common,
    angle: 116,
    origin: { x: 0.82, y: 0.7 },
  });
}
