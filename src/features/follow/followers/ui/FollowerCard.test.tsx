import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FollowerCard from "./FollowerCard";

vi.mock("next/image", () => ({
  default: () => <span data-testid="avatar" />,
}));

describe("FollowerCard presence", () => {
  it("온라인 상태와 참여 중인 공개 방 링크를 표시한다", () => {
    render(
      <FollowerCard
        user={{
          cursorId: 1,
          nickname: "민지",
          slug: "minji",
          profileImageUrl: null,
          online: true,
          room: { slug: "late-night-jazz", title: "새벽 재즈" },
          presenceVersion: 42,
        }}
      />,
    );

    expect(screen.getByText("온라인")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새벽 재즈" })).toHaveAttribute(
      "href",
      "/room/late-night-jazz",
    );
  });
});
