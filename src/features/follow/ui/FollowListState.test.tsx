import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import styles from "./FollowListState.module.css";
import FollowListState from "./FollowListState";

describe("FollowListState", () => {
  it("빈 목록 문구만 위로 올릴 수 있다", () => {
    render(<FollowListState raised>목록이 없습니다.</FollowListState>);

    expect(screen.getByText("목록이 없습니다.")).toHaveClass(styles.raised);
  });

  it("기본 로딩 상태에는 위치 보정을 적용하지 않는다", () => {
    render(<FollowListState>불러오는 중</FollowListState>);

    expect(screen.getByText("불러오는 중")).not.toHaveClass(styles.raised);
  });
});
