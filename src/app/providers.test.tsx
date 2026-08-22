import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  badgeProvider: vi.fn(),
  ensureCsrf: vi.fn(),
  followProvider: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
}));

vi.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => null,
}));

vi.mock("../shared/api/csrf/ensureCsrf", () => ({
  ensureCsrf: mocks.ensureCsrf,
}));

vi.mock("../features/badge/events/ui/BadgeAwardProvider", () => ({
  default: ({ children }: { children: ReactNode }) => {
    mocks.badgeProvider();
    return children;
  },
}));

vi.mock("../features/follow/presence/ui/FollowPresenceProvider", () => ({
  default: ({ children }: { children: ReactNode }) => {
    mocks.followProvider();
    return children;
  },
}));

vi.mock("../shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

import Providers from "./providers";

describe("Providers", () => {
  beforeEach(() => {
    mocks.badgeProvider.mockReset();
    mocks.ensureCsrf.mockReset();
    mocks.ensureCsrf.mockResolvedValue(undefined);
    mocks.followProvider.mockReset();
    mocks.usePathname.mockReset();
  });

  it("점검 페이지에서는 API·SSE·STOMP 전역 Provider를 시작하지 않는다", () => {
    mocks.usePathname.mockReturnValue("/maintenance");

    render(
      <Providers>
        <p>점검 안내</p>
      </Providers>,
    );

    expect(screen.getByText("점검 안내")).toBeInTheDocument();
    expect(mocks.ensureCsrf).not.toHaveBeenCalled();
    expect(mocks.followProvider).not.toHaveBeenCalled();
    expect(mocks.badgeProvider).not.toHaveBeenCalled();
  });

  it("일반 페이지에서는 기존 전역 Provider를 유지한다", async () => {
    mocks.usePathname.mockReturnValue("/home");

    render(
      <Providers>
        <p>홈</p>
      </Providers>,
    );

    expect(mocks.followProvider).toHaveBeenCalled();
    expect(mocks.badgeProvider).toHaveBeenCalled();
    await waitFor(() => expect(mocks.ensureCsrf).toHaveBeenCalledOnce());
  });
});
