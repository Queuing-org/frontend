import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProfileStats from "./ProfileStats";

describe("ProfileStats", () => {
  it("큐잉 횟수와 음악력을 표시하고 이용 시간은 하드코딩 상태로 유지한다", () => {
    render(<ProfileStats musicPower={9876} queuingCount={1234} />);

    expect(screen.getByText("1,234")).toBeInTheDocument();
    expect(screen.getByText("9,876")).toBeInTheDocument();
    expect(screen.getByText("이용 시간")).toBeInTheDocument();
    expect(screen.getByText("개발중입니다.")).toBeInTheDocument();
  });

  it("통계가 누락되면 대시를 표시한다", () => {
    render(<ProfileStats />);

    expect(screen.getAllByText("-")).toHaveLength(2);
  });
});
