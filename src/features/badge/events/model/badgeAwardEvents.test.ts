import { describe, expect, it } from "vitest";
import { enqueueUnseenBadgeAwards } from "./badgeAwardEvents";

describe("칭호 획득 이벤트 큐", () => {
  it("event ID와 badgeCode 조합으로 중복을 제거하고 다중 칭호 순서를 보존한다", () => {
    const seen = new Set<string>();
    const badges = [
      { badgeCode: "A", name: "첫 칭호" },
      { badgeCode: "B", name: "둘째 칭호" },
    ];

    expect(
      enqueueUnseenBadgeAwards({ eventId: "event-1", badges, seen }),
    ).toEqual(badges);
    expect(
      enqueueUnseenBadgeAwards({ eventId: "event-1", badges, seen }),
    ).toEqual([]);
    expect(
      enqueueUnseenBadgeAwards({
        eventId: "event-2",
        badges: [badges[0]],
        seen,
      }),
    ).toEqual([badges[0]]);
  });
});
