import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROOM_DELETED_NOTICE, storeRoomDeletedNotice } from "@/src/features/room/model/roomTerminationNotice";
import RoomDeletedNoticeBanner from "./RoomDeletedNoticeBanner";

describe("RoomDeletedNoticeBanner", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("sessionStorage 알림을 한 번만 소비하고 닫을 수 있다", () => {
    storeRoomDeletedNotice();
    const { unmount } = render(<RoomDeletedNoticeBanner />);
    expect(screen.getByRole("status")).toHaveTextContent(ROOM_DELETED_NOTICE);
    fireEvent.click(screen.getByRole("button", { name: "알림 닫기" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    unmount();
    render(<RoomDeletedNoticeBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("5초 뒤 자동으로 닫힌다", () => {
    storeRoomDeletedNotice();
    render(<RoomDeletedNoticeBanner />);
    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
