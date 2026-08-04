export async function launchBadgeAwardConfetti(signal?: AbortSignal) {
  const { default: confetti } = await import("canvas-confetti");
  if (signal?.aborted) {
    return;
  }
  const scopedConfetti = confetti.create(undefined, {
    disableForReducedMotion: true,
    resize: true,
  });
  const reset = () => scopedConfetti.reset();
  signal?.addEventListener("abort", reset, { once: true });
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

  try {
    await Promise.all([
      scopedConfetti({
        ...common,
        angle: 64,
        origin: { x: 0.18, y: 0.7 },
      }),
      scopedConfetti({
        ...common,
        angle: 116,
        origin: { x: 0.82, y: 0.7 },
      }),
    ]);
  } finally {
    signal?.removeEventListener("abort", reset);
  }
}
