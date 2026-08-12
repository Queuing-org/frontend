import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import RoomInfo from "./RoomInfo";

it("실제 방의 빈 태그는 FREE로 표시한다", () => {
  render(
    <RoomInfo
      roomInfo={{
        activeUsersCount: 1,
        hasPassword: false,
        tags: [],
        title: "자유로운 방",
      }}
    />,
  );

  expect(screen.getByText("FREE")).toBeVisible();
  expect(screen.queryByText("태그없음")).toBeNull();
});

it("선택된 방이 없으면 FREE가 아니라 기존 빈 상태를 표시한다", () => {
  render(<RoomInfo roomInfo={null} />);

  expect(screen.getByText("선택된 방 없음")).toBeVisible();
  expect(screen.getByText("태그없음")).toBeVisible();
  expect(screen.queryByText("FREE")).toBeNull();
});
