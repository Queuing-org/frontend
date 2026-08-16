import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { userKeys } from "@/src/features/user/model/queryKeys";
import { syncMusicPowerCaches } from "./syncMusicPowerCaches";
import type { MusicPowerResponse } from "./types";

describe("syncMusicPowerCaches", () => {
  it("누적 점수는 사용자 cache 전체에 반영하고 재생 건별 myVote는 보존한다", () => {
    const queryClient = new QueryClient();
    const firstKey = userKeys.musicPower("target", "room", "entry-1");
    const secondKey = userKeys.musicPower("target", "room", "entry-2");
    queryClient.setQueryData<MusicPowerResponse>(firstKey, {
      musicPower: 3,
      myVote: "UPVOTE",
      targetUserSlug: "target",
    });
    queryClient.setQueryData<MusicPowerResponse>(secondKey, {
      musicPower: 3,
      myVote: null,
      targetUserSlug: "target",
    });

    syncMusicPowerCaches(
      queryClient,
      {
        musicPower: 4,
        myVote: "DOWNVOTE",
        targetUserSlug: "target",
      },
      { roomSlug: "room", entryId: "entry-2" },
    );

    expect(queryClient.getQueryData(firstKey)).toMatchObject({
      musicPower: 4,
      myVote: "UPVOTE",
    });
    expect(queryClient.getQueryData(secondKey)).toMatchObject({
      musicPower: 4,
      myVote: "DOWNVOTE",
    });
  });
});
