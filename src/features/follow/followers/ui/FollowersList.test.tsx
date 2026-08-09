import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFollowersList } from "../hooks/useFollowersList";
import FollowersList from "./FollowersList";

vi.mock("../hooks/useFollowersList", () => ({ useFollowersList: vi.fn() }));

describe("FollowersList", () => {
  it("빈 목록 안내를 공통 빈 상태로 표시한다", () => {
    vi.mocked(useFollowersList).mockReturnValue({
      data: { hasNext: false, items: [], nextCursor: null },
    } as ReturnType<typeof useFollowersList>);

    render(<FollowersList />);

    expect(screen.getByText("팔로워가 없습니다.")).toBeInTheDocument();
  });
});
