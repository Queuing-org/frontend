import { beforeEach, describe, expect, it, vi } from "vitest";
import { launchBadgeAwardConfetti } from "./badgeAwardConfetti";

const confettiMocks = vi.hoisted(() => {
  const fire = vi.fn();
  const reset = vi.fn();
  const create = vi.fn(() => Object.assign(fire, { reset }));
  return { create, fire, reset };
});

vi.mock("canvas-confetti", () => ({
  default: { create: confettiMocks.create },
}));

describe("launchBadgeAwardConfetti", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("abort되면 modal 전용 confetti animation을 즉시 reset한다", async () => {
    let finishAnimation: (() => void) | undefined;
    const animation = new Promise<undefined>((resolve) => {
      finishAnimation = () => resolve(undefined);
    });
    confettiMocks.fire.mockReturnValue(animation);
    confettiMocks.reset.mockImplementation(() => finishAnimation?.());
    const controller = new AbortController();

    const launch = launchBadgeAwardConfetti(controller.signal);
    await vi.waitFor(() => expect(confettiMocks.fire).toHaveBeenCalledTimes(2));
    controller.abort();
    await launch;

    expect(confettiMocks.create).toHaveBeenCalledWith(undefined, {
      disableForReducedMotion: true,
      resize: true,
    });
    expect(confettiMocks.reset).toHaveBeenCalledOnce();
  });

  it("animation 완료 후에는 abort listener를 제거한다", async () => {
    confettiMocks.fire.mockResolvedValue(undefined);
    const controller = new AbortController();

    await launchBadgeAwardConfetti(controller.signal);
    controller.abort();

    expect(confettiMocks.reset).not.toHaveBeenCalled();
  });
});
