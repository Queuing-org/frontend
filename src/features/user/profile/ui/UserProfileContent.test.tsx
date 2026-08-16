import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import UserProfileContent from "./UserProfileContent";

describe("UserProfileContent", () => {
  it("최애곡 두 줄과 무관하게 칭호·큐잉 횟수·음악력을 같은 열로 묶는다", () => {
    render(
      <UserProfileContent
        avatarUrl={null}
        badgeLabel="리듬 장인"
        isBadgeLoading={false}
        listeningDurationSeconds={3600}
        musicPower={77}
        nickname="공개 닉네임"
        queuingCount={12}
        statusMessage="첫 번째 줄을 채우고 두 번째 줄까지 이어지는 최애곡"
        textLineClamp={2}
      />,
    );

    const badgeColumn = screen.getByText("칭호").parentElement?.parentElement;
    const favoriteSongColumn =
      screen.getByText("최애곡").parentElement?.parentElement;

    expect(badgeColumn).toContainElement(
      screen.getByText("큐잉 횟수").parentElement,
    );
    expect(badgeColumn).toContainElement(screen.getByText("음악력").parentElement);
    expect(favoriteSongColumn).toContainElement(
      screen.getByText("이용 시간").parentElement,
    );
    expect(badgeColumn).not.toBe(favoriteSongColumn);
    const favoriteSongValue = screen.getByText(
      "첫 번째 줄을 채우고 두 번째 줄까지 이어지는 최애곡",
    );
    expect(favoriteSongValue).toHaveAttribute("data-line-clamp", "2");
    expect(favoriteSongValue.parentElement?.parentElement).toBe(
      screen.getByText("최애곡").parentElement,
    );
  });
});
