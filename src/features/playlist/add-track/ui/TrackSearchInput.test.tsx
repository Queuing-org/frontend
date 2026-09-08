import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTestQueryClient,
  createTestQueryClientWrapper,
} from "@/src/shared/test/queryClient";
import { ApiError } from "@/src/shared/api/api-error";
import {
  fetchFrequentTracks,
  searchYouTubeVideos,
} from "../../api/fetchTrackSuggestions";
import TrackSearchInput from "./TrackSearchInput";
const auth = vi.hoisted(() => ({ slug: "me" as string | null }));
vi.mock("@/src/features/user/session/hooks/useMe", () => ({
  useMe: () => ({
    data: auth.slug ? { slug: auth.slug } : null,
    isError: false,
  }),
}));
vi.mock("../../api/fetchTrackSuggestions", () => ({
  fetchFrequentTracks: vi.fn(),
  searchYouTubeVideos: vi.fn(),
}));
const frequent = {
  videoId: "video",
  provider: "YOUTUBE" as const,
  title: "자주 듣는 곡",
  thumbnailUrl: null,
  durationMs: 1000,
  requestCount: 2,
};
const video = {
  videoId: "result",
  title: "검색 결과",
  channelTitle: "채널",
  thumbnailUrl: "https://img.youtube.com/vi/result/default.jpg",
  durationMs: 1000,
};
function Harness() {
  const [value, setValue] = useState("");
  return (
    <>
      <TrackSearchInput
        value={value}
        onChange={setValue}
        disabled={false}
        invalid={false}
      />
      <textarea aria-label="선정 이유" defaultValue="유지할 이유" />
    </>
  );
}
function setup() {
  const client = createTestQueryClient();
  const rendered = render(<Harness />, {
    wrapper: createTestQueryClientWrapper(client),
  });
  return { ...rendered, client, input: screen.getByRole("combobox") };
}
beforeEach(() => {
  auth.slug = "me";
  vi.clearAllMocks();
  vi.mocked(fetchFrequentTracks).mockResolvedValue([frequent]);
  vi.mocked(searchYouTubeVideos).mockResolvedValue([video]);
});
afterEach(() => vi.useRealTimers());

describe("TrackSearchInput", () => {
  it("자동 포커스에서 자주 신청한 음악을 열고 키보드 선택은 URL만 바꾼다", async () => {
    const { input, client } = setup();
    await screen.findByRole("option", { name: "자주 듣는 곡" });
    expect(input).toHaveFocus();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveValue("https://www.youtube.com/watch?v=video");
    expect(screen.getByLabelText("선정 이유")).toHaveValue("유지할 이유");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    client.clear();
  });
  it("첫 위 방향키는 마지막 지원 곡으로 이동하며 비지원 곡을 건너뛴다", async () => {
    vi.mocked(fetchFrequentTracks).mockResolvedValue([
      frequent,
      { ...frequent, videoId: "soundcloud", provider: "SOUNDCLOUD" },
      { ...frequent, videoId: "last", title: "마지막 곡" },
    ]);
    const { input, client } = setup();
    await screen.findByRole("option", { name: "마지막 곡" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getByRole("option", { name: "마지막 곡" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(
      screen.getByRole("option", { name: "자주 듣는 곡" }),
    ).toHaveAttribute("aria-selected", "true");
    client.clear();
  });
  it("300ms 디바운스, 조합 중 요청·Enter 차단, 잘못된 URL 제목 검색 차단", async () => {
    vi.useFakeTimers();
    const { input, client } = setup();
    fireEvent.change(input, { target: { value: "아이유" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    expect(searchYouTubeVideos).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(searchYouTubeVideos).toHaveBeenCalledWith(
      "아이유",
      expect.any(AbortSignal),
    );
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "아이유 좋은" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(searchYouTubeVideos).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(input).toHaveValue("아이유 좋은");
    fireEvent.compositionEnd(input);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(searchYouTubeVideos).toHaveBeenLastCalledWith(
      "아이유 좋은",
      expect.any(AbortSignal),
    );
    fireEvent.change(input, { target: { value: "https://youtube.com/watch" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(searchYouTubeVideos).toHaveBeenCalledTimes(2);
    client.clear();
  });
  it("검색 교체·닫기 시 취소하고 역순 응답을 새 결과로 표시하지 않는다", async () => {
    let finishOld!: (value: (typeof video)[]) => void;
    let oldSignal!: AbortSignal;
    vi.mocked(searchYouTubeVideos).mockImplementation((query, signal) =>
      query === "old"
        ? new Promise((resolve) => {
            finishOld = resolve;
            oldSignal = signal!;
          })
        : Promise.resolve([video]),
    );
    const { input, client } = setup();
    fireEvent.change(input, { target: { value: "old" } });
    await waitFor(() => expect(searchYouTubeVideos).toHaveBeenCalled());
    fireEvent.change(input, { target: { value: "new" } });
    await screen.findByRole("option", { name: "검색 결과 채널" });
    expect(oldSignal.aborted).toBe(true);
    await act(async () => finishOld([{ ...video, title: "이전 결과" }]));
    expect(screen.queryByText("이전 결과")).not.toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    client.clear();
  });
  it("계정별 캐시를 분리하고 미로그인에는 목록을 표시하지 않는다", async () => {
    const { rerender, client } = setup();
    await screen.findByText("자주 듣는 곡");
    auth.slug = "other";
    vi.mocked(fetchFrequentTracks).mockResolvedValue([
      { ...frequent, title: "다른 계정의 곡" },
    ]);
    rerender(<Harness />);
    expect(screen.queryByText("자주 듣는 곡")).not.toBeInTheDocument();
    await screen.findByText("다른 계정의 곡");
    auth.slug = null;
    rerender(<Harness />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    client.clear();
  });
  it("SoundCloud 선택을 막고 Escape를 먼저 소비하며 Tab/바깥 클릭으로 닫는다", async () => {
    vi.mocked(fetchFrequentTracks).mockResolvedValue([
      { ...frequent, provider: "SOUNDCLOUD" },
    ]);
    const { input, client } = setup();
    const option = await screen.findByRole("option");
    expect(option).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(option);
    expect(input).toHaveValue("");
    const outerEscape = vi.fn();
    document.addEventListener("keydown", outerEscape);
    fireEvent.keyDown(input, { key: "Escape" });
    expect(outerEscape).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(outerEscape).toHaveBeenCalledTimes(1);
    document.removeEventListener("keydown", outerEscape);
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "Tab" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    fireEvent.focus(input);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    client.clear();
  });
  it("할당량 실패를 안내하고 자동 재요청하지 않는다", async () => {
    vi.mocked(searchYouTubeVideos).mockRejectedValue(
      new ApiError({
        status: 503,
        code: "room.youtube-api-quota-exceeded",
        message: "quota",
      }),
    );
    const { input, client } = setup();
    fireEvent.change(input, { target: { value: "아이유" } });
    await screen.findByText(
      "YouTube 검색 한도를 초과했어요. 영상 URL을 직접 입력해 주세요.",
    );
    expect(searchYouTubeVideos).toHaveBeenCalledTimes(1);
    client.clear();
  });
});
