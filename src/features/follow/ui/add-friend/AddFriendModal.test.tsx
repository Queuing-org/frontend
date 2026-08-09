import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAddFriendModalState } from "@/src/features/follow/hooks/useAddFriendModalState";
import type { SearchUser } from "@/src/features/user/search/model/types";
import AddFriendModal from "./AddFriendModal";

vi.mock("next/image", () => ({
  default: ({ alt = "", src }: { alt?: string; src: string }) => (
    <span aria-label={alt || undefined} data-image-src={src} />
  ),
}));
vi.mock("@/src/features/follow/hooks/useAddFriendModalState", () => ({
  useAddFriendModalState: vi.fn(),
}));

const selectUser = vi.fn();
const submit = vi.fn();
const updateQuery = vi.fn();
const clearQuery = vi.fn();
const searchedUser: SearchUser = {
  nickname: "감튀",
  profileImageUrl: "/profile.png",
  relationship: "NONE",
  slug: "gam-twi",
};

function mockModalState(
  overrides: Partial<ReturnType<typeof useAddFriendModalState>> = {},
) {
  vi.mocked(useAddFriendModalState).mockReturnValue({
    canSubmit: false,
    clearQuery,
    errorMessage: null,
    isResultsOpen: true,
    isSearchError: false,
    isSearchLoading: false,
    isSubmitting: false,
    isSuccess: false,
    query: "감",
    selectUser,
    submit,
    updateQuery,
    users: [searchedUser],
    ...overrides,
  });
}

describe("AddFriendModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModalState();
  });

  it("검색 결과에는 프로필 이미지와 닉네임만 표시하고 선택을 전달한다", async () => {
    const user = userEvent.setup();
    render(<AddFriendModal onClose={vi.fn()} />);

    expect(screen.getByText("감튀")).toBeInTheDocument();
    expect(document.querySelector('[data-image-src="/profile.png"]')).toBeInTheDocument();
    expect(screen.queryByText("gam-twi")).not.toBeInTheDocument();
    expect(screen.queryByText("미팔로우")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "감튀" }));
    expect(selectUser).toHaveBeenCalledWith(searchedUser);
  });

  it("선택된 사용자는 입력창에 닉네임으로 표시하고 서버 오류를 노출한다", () => {
    mockModalState({
      canSubmit: true,
      errorMessage: "이미 팔로우 중인 친구예요!",
      isResultsOpen: false,
      query: "감튀교",
      users: [],
    });

    render(<AddFriendModal onClose={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "친구 닉네임 검색" })).toHaveValue(
      "감튀교",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "이미 팔로우 중인 친구예요!",
    );
  });

  it("팔로우와 취소 액션을 각각 전달한다", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    mockModalState({ canSubmit: true, isResultsOpen: false, users: [] });

    render(<AddFriendModal onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "팔로우" }));
    expect(submit).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("성공 feedback을 표시한다", () => {
    mockModalState({
      canSubmit: true,
      isResultsOpen: false,
      isSuccess: true,
      users: [],
    });

    render(<AddFriendModal onClose={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "성공적으로 팔로우했어요!",
    );
  });

  it("Escape로 모달을 닫는다", () => {
    const onClose = vi.fn();
    mockModalState({ canSubmit: true, isResultsOpen: false, users: [] });

    render(<AddFriendModal onClose={onClose} />);

    const input = screen.getByRole("textbox", { name: "친구 닉네임 검색" });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    expect(input).toBeInTheDocument();
  });

  it("한글 조합 중 Enter는 submit을 발생시키지 않는다", () => {
    render(<AddFriendModal onClose={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: "친구 닉네임 검색" });
    const enterDuringComposition = createEvent.keyDown(input, {
      key: "Enter",
      isComposing: true,
    });

    fireEvent(input, enterDuringComposition);

    expect(enterDuringComposition.defaultPrevented).toBe(true);
    expect(submit).not.toHaveBeenCalled();
  });
});
