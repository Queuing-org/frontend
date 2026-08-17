import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import RoomQueueTabs from "./RoomQueueTabs";

it("로드된 행 수와 무관한 서버 totalPendingCount를 탭 수로 표시한다", () => {
  render(
    <RoomQueueTabs
      activeTab="all"
      allCount={237}
      myCount={104}
      onChange={vi.fn()}
    />,
  );

  expect(screen.getByRole("tab", { name: /전체 트랙\s*237/ })).toBeVisible();
  expect(screen.getByRole("tab", { name: /내 노래\s*104/ })).toBeVisible();
  expect(screen.queryByRole("tab", { name: "지난 곡" })).not.toBeInTheDocument();
});

it("개인 큐를 불러오는 동안 실제 0개처럼 표시하지 않는다", () => {
  render(
    <RoomQueueTabs
      activeTab="all"
      allCount={2}
      myCount={null}
      onChange={vi.fn()}
    />,
  );

  expect(screen.getByRole("tab", { name: /내 노래\s*…/ })).toBeVisible();
  expect(screen.queryByRole("tab", { name: /내 노래\s*0/ }))
    .not.toBeInTheDocument();
});
