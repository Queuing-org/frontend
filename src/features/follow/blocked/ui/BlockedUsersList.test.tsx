import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBlockedUsers } from "../hooks/useBlockedUsers";
import { useUnblockUser } from "../hooks/useUnblockUser";
import BlockedUsersList from "./BlockedUsersList";

vi.mock("next/image", () => ({
  default: ({ alt = "", ...props }: { alt?: string }) => (
    <span aria-label={alt || undefined} {...props} />
  ),
}));
vi.mock("../hooks/useBlockedUsers", () => ({ useBlockedUsers: vi.fn() }));
vi.mock("../hooks/useUnblockUser", () => ({ useUnblockUser: vi.fn() }));

const fetchNextPage = vi.fn();
const mutate = vi.fn();
const reset = vi.fn();

describe("BlockedUsersList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBlockedUsers).mockReturnValue({
      data: {
        pageParams: [null],
        pages: [
          {
            hasNext: true,
            items: [
              {
                blockedAt: "2026-07-10T00:00:00.000Z",
                cursorId: 300,
                nickname: "민지",
                profileImageUrl: null,
                slug: "minji",
              },
            ],
            nextCursor: 287,
          },
        ],
      },
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    } as unknown as ReturnType<typeof useBlockedUsers>);
    vi.mocked(useUnblockUser).mockReturnValue({
      error: null,
      isPending: false,
      mutate,
      reset,
      variables: undefined,
    } as unknown as ReturnType<typeof useUnblockUser>);
  });

  it("presence 없이 닉네임과 차단 해제 버튼만 표시한다", async () => {
    const user = userEvent.setup();
    render(<BlockedUsersList />);

    expect(screen.getByText("민지")).toBeInTheDocument();
    expect(screen.queryByText("온라인")).not.toBeInTheDocument();
    expect(screen.queryByText("오프라인")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "차단 해제" }));
    expect(reset).toHaveBeenCalledOnce();
    expect(mutate).toHaveBeenCalledWith("minji");
  });

  it("더 보기는 다음 cursor 페이지를 요청한다", async () => {
    const user = userEvent.setup();
    render(<BlockedUsersList />);

    await user.click(screen.getByRole("button", { name: "더 보기" }));
    expect(fetchNextPage).toHaveBeenCalledOnce();
  });
});
