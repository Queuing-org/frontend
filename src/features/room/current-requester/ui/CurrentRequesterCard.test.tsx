import { render } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import CurrentRequesterCard from "./CurrentRequesterCard";

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

describe("CurrentRequesterCard", () => {
  it("곡 제목을 overflow marquee 영역으로 렌더링한다", () => {
    const { container } = render(
      <CurrentRequesterCard
        durationMs={202_000}
        isOwner={false}
        requester={{
          avatarUrl: null,
          nickname: "신청자",
          slug: "requester",
        }}
        story={null}
        trackTitle="한 줄을 넘어가는 아주 긴 곡 제목"
      />,
    );

    const titleMarquee = container.querySelector("[data-overflowing]");
    expect(titleMarquee).toHaveTextContent(
      "한 줄을 넘어가는 아주 긴 곡 제목",
    );
  });
});
