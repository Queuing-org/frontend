import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FollowUser } from "../model/types";
import FollowPresenceCard from "./FollowPresenceCard";

vi.mock("next/image", () => ({
  default: ({ alt = "", ...props }: { alt?: string }) => (
    <span aria-label={alt || undefined} {...props} />
  ),
}));

const baseUser: FollowUser = {
  cursorId: 1,
  nickname: "민지",
  slug: "minji",
  profileImageUrl: null,
  online: true,
  room: null,
  presenceVersion: 42,
};

describe("FollowPresenceCard", () => {
  it("온라인 사용자가 참여 중인 방은 상태 문구 없이 화살표 링크만 제공한다", () => {
    render(
      <FollowPresenceCard
        user={{
          ...baseUser,
          room: { slug: "late-night-jazz", title: "새벽 재즈" },
        }}
      />,
    );

    expect(screen.queryByText("새벽 재즈 참여 중")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "새벽 재즈 방으로 이동" }),
    ).toHaveAttribute("href", "/room/late-night-jazz");
    const tooltip = screen.getByText("따라가기");
    expect(
      screen.getByRole("link", { name: "새벽 재즈 방으로 이동" }),
    ).toHaveAttribute("aria-describedby", tooltip.id);
  });

  it("방에 참여하지 않은 온라인 사용자는 접근성 라벨이 있는 초록점만 표시한다", () => {
    const { container } = render(<FollowPresenceCard user={baseUser} />);

    expect(screen.queryByText("온라인")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-online="true"][aria-label="온라인"]'),
    ).toBeInTheDocument();
  });

  it("오프라인이면 stale room을 숨기고 접근성 라벨이 있는 빨간점만 표시한다", () => {
    const { container } = render(
      <FollowPresenceCard
        user={{
          ...baseUser,
          online: false,
          room: { slug: "late-night-jazz", title: "새벽 재즈" },
        }}
      />,
    );

    expect(screen.queryByText("오프라인")).not.toBeInTheDocument();
    expect(screen.queryByText("새벽 재즈 참여 중")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-online="false"][aria-label="오프라인"]'),
    ).toBeInTheDocument();
  });

  it("presence 권한이 없으면 오프라인을 추정하지 않고 점과 방 링크를 숨긴다", () => {
    const { container } = render(
      <FollowPresenceCard
        user={{
          cursorId: 2,
          nickname: "지수",
          profileImageUrl: null,
          slug: "jisoo",
        }}
      />,
    );

    expect(container.querySelector("[data-online]")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("카드 본문을 누르면 프로필 선택을 전달하고 방 화살표는 별도 링크로 유지한다", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <FollowPresenceCard
        onSelect={onSelect}
        user={{
          ...baseUser,
          room: { slug: "late-night-jazz", title: "새벽 재즈" },
        }}
      />,
    );

    const profileButton = screen.getByRole("button", {
      name: "민지 프로필 보기",
    });
    await user.click(profileButton);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "minji" }),
      profileButton,
    );
    expect(
      screen.getByRole("link", { name: "새벽 재즈 방으로 이동" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "차단" })).not.toBeInTheDocument();
  });
});
