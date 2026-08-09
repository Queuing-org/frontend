import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFollowingList } from "../hooks/useFollowingList";
import FollowingList from "./FollowingList";

vi.mock("../hooks/useFollowingList", () => ({ useFollowingList: vi.fn() }));

describe("FollowingList", () => {
  it("빈 목록 안내를 공통 빈 상태로 표시한다", () => {
    vi.mocked(useFollowingList).mockReturnValue({
      data: { hasNext: false, items: [], nextCursor: null },
    } as ReturnType<typeof useFollowingList>);

    render(<FollowingList />);

    expect(screen.getByText("팔로잉한 사용자가 없습니다.")).toBeInTheDocument();
  });
});
