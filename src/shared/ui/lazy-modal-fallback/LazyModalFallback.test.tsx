import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LazyModalFallback from "./LazyModalFallback";

describe("LazyModalFallback", () => {
  it("지연 청크를 기다리는 동안 접근 가능한 modal shell에 초점을 둔다", () => {
    render(<LazyModalFallback label="설정 화면 로딩 중" />);

    const dialog = screen.getByRole("dialog", {
      name: "설정 화면 로딩 중",
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveFocus();
  });
});
