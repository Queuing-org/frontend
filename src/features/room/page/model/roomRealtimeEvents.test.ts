import { describe, expect, it } from "vitest";
import {
  applyMusicPowerChange,
  applyTrackStarted,
  isMusicPowerChangedData,
  isTrackStartedData,
} from "./roomRealtimeEvents";

const trackStarted = {
  entryId: "entry-1",
  track: {
    title: "노래",
    videoId: "video",
    provider: "YOUTUBE",
    durationMs: 1000,
    thumbnailUrl: "https://example.com/a.jpg",
  },
  addedBy: {
    slug: "requester",
    nickname: "신청자",
    avatarUrl: null,
  },
  playbackStatus: {
    status: "PLAYING",
    videoId: "video",
    currentTime: 0,
    serverTimestamp: 100,
  },
  revision: 12,
} as const;

describe("방 실시간 이벤트 guard와 캐시 변환", () => {
  it("MUSIC_POWER_CHANGED는 기존 myVote를 보존한다", () => {
    const change = {
      entryId: "entry-1",
      targetUserSlug: "requester",
      musicPower: 9,
    };
    expect(isMusicPowerChangedData(change)).toBe(true);
    expect(
      applyMusicPowerChange(
        {
          musicPower: 7,
          myVote: "DOWNVOTE",
          targetUserSlug: "requester",
        },
        change,
      ),
    ).toEqual({
      musicPower: 9,
      myVote: "DOWNVOTE",
      targetUserSlug: "requester",
    });
  });

  it("TRACK_STARTED의 addedBy를 playback 현재 신청자에 즉시 반영한다", () => {
    expect(isTrackStartedData(trackStarted)).toBe(true);
    expect(applyTrackStarted(undefined, trackStarted, 100).currentEntry?.addedBy)
      .toEqual(trackStarted.addedBy);
  });

  it("필수 필드가 빠진 이벤트를 거부한다", () => {
    expect(isTrackStartedData({ ...trackStarted, addedBy: {} })).toBe(false);
  });

  it("TRACK_STARTED의 null 썸네일을 허용한다", () => {
    expect(
      isTrackStartedData({
        ...trackStarted,
        track: { ...trackStarted.track, thumbnailUrl: null },
      }),
    ).toBe(true);
  });
});
