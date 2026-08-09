import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FollowTabs from "./FollowTabs";

describe("FollowTabs", () => {
  it("팔로잉·팔로워 수와 각 전용 아이콘을 표시한다", () => {
    render(
      <FollowTabs
        activeTab="following"
        counts={{ following: "12", followers: "100+" }}
        onChange={vi.fn()}
      />,
    );

    const following = screen.getByRole("button", { name: "팔로잉 12명" });
    const followers = screen.getByRole("button", { name: "팔로워 100+명" });

    expect(following).toHaveTextContent("팔로잉12");
    expect(following).not.toHaveTextContent("(12)");
    expect(followers).toHaveTextContent("팔로워100+");
    expect(followers).not.toHaveTextContent("(100+)");

    expect(following.firstElementChild).toHaveStyle({
      "--tab-icon-src": "url(/icons/following-tab.svg)",
    });
    expect(followers.firstElementChild).toHaveStyle({
      "--tab-icon-src": "url(/icons/follower-tab.svg)",
    });
  });

  it("탭을 누르면 선택 변경을 전달한다", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FollowTabs activeTab="following" counts={{}} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: "팔로워" }));
    expect(onChange).toHaveBeenCalledWith("followers");
  });
});
