import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SearchEmptyState from "./SearchEmptyState";

describe("SearchEmptyState", () => {
  it("검색어와 방 만들기 액션을 제공한다", async () => {
    const user = userEvent.setup();
    const onCreateRoom = vi.fn();

    render(
      <SearchEmptyState
        query="공부 음악"
        onCreateRoom={onCreateRoom}
      />,
    );

    expect(screen.getByText("검색 결과가 없습니다")).toBeInTheDocument();
    expect(
      screen.getByText("‘공부 음악’에 관한 방을 찾을 수 없어요."),
    ).toBeInTheDocument();
    const createButton = screen.getByRole("button", {
      name: "방 만들러 가기",
    });
    await user.click(createButton);
    expect(onCreateRoom).toHaveBeenCalledOnce();
  });
});
