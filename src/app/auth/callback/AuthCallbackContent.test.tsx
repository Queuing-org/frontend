import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { ApiError } from "@/src/shared/api/api-error";
import AuthCallbackContent from "./AuthCallbackContent";

const replace = vi.fn();
let nextParam: string | null = "/room/safe";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: () => nextParam }),
}));
vi.mock("@/src/features/user/session/hooks/useMe", () => ({
  useMe: vi.fn(),
}));

describe("AuthCallbackContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextParam = "/room/safe";
  });

  it.each([403, 404])("일반 %s 오류는 온보딩 대신 안전한 next로 이동한다", async (status) => {
    vi.mocked(useMe).mockReturnValue({
      data: undefined,
      error: new ApiError({ status, message: "요청 실패" }),
      isError: true,
      isSuccess: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useMe>);

    render(<AuthCallbackContent />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/room/safe"));
    expect(replace).not.toHaveBeenCalledWith(
      expect.stringContaining("/onboarding"),
    );
  });

  it("외부 next는 홈으로 제한한다", async () => {
    nextParam = "https://evil.example";
    vi.mocked(useMe).mockReturnValue({
      data: undefined,
      error: new ApiError({ status: 500, message: "요청 실패" }),
      isError: true,
      isSuccess: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useMe>);

    render(<AuthCallbackContent />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });
});
