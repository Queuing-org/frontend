import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSocketClient } from "@/src/shared/api/websocket/stompConnection";
import { publishAddTrack } from "./publishAddTrack";

vi.mock("@/src/shared/api/websocket/stompConnection", () => ({
  getSocketClient: vi.fn(),
}));

describe("publishAddTrack", () => {
  const publish = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSocketClient).mockReturnValue({
      publish,
    } as unknown as ReturnType<typeof getSocketClient>);
  });

  it("재생목록 여부를 WebSocket payload에 포함한다", () => {
    const playlistUrl =
      "https://www.youtube.com/watch?v=current&list=PL_playlist-1";

    publishAddTrack("room", {
      story: " 사연 ",
      videoId: playlistUrl,
      youtubePlaylist: true,
    });

    expect(publish).toHaveBeenCalledWith({
      destination: "/app/room/room/playlist",
      body: JSON.stringify({
        story: "사연",
        videoId: playlistUrl,
        youtubePlaylist: true,
      }),
    });
  });

  it("단일 영상 요청에는 youtubePlaylist false를 보낸다", () => {
    publishAddTrack("room", {
      story: null,
      videoId: "video-id",
      youtubePlaylist: false,
    });

    expect(publish).toHaveBeenCalledWith({
      destination: "/app/room/room/playlist",
      body: JSON.stringify({
        story: null,
        videoId: "video-id",
        youtubePlaylist: false,
      }),
    });
  });
});
