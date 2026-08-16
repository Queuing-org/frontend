import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NotFound from "./not-found";

vi.mock("next/image", () => ({
  default: () => <span aria-hidden="true" />,
}));

describe("NotFound", () => {
  it("안내와 함께 로고 및 방 검색 액션을 유지한다", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { name: "존재하지 않는 페이지입니다." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "QUEUING.CC" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "방 검색" })).toHaveAttribute(
      "href",
      "/search",
    );
  });
});
