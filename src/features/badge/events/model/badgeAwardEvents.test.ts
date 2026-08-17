import { describe, expect, it } from "vitest";
import {
  enqueueUnseenBadgeAwards,
  getBadgeAchievementCopy,
  parseBadgeAwardEvent,
} from "./badgeAwardEvents";

describe("칭호 획득 이벤트 큐", () => {
  it("event ID와 badgeCode 조합으로 중복을 제거하고 다중 칭호 순서를 보존한다", () => {
    const seen = new Set<string>();
    const badges = [
      { badgeCode: "A", description: "채팅 1회 달성", name: "첫 칭호" },
      { badgeCode: "B", description: null, name: "둘째 칭호" },
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

  it("nullable description이 포함된 새 SSE 계약만 파싱한다", () => {
    expect(
      parseBadgeAwardEvent(
        JSON.stringify({
          roomSlug: "room",
          userSlug: "me",
          nickname: "나",
          badges: [
            {
              badgeCode: "A",
              description: "누적 큐잉 5회 달성",
              name: "첫 신청곡",
            },
            { badgeCode: "B", description: null, name: "두 번째 칭호" },
          ],
        }),
      ),
    ).toEqual({
      roomSlug: "room",
      userSlug: "me",
      nickname: "나",
      badges: [
        {
          badgeCode: "A",
          description: "누적 큐잉 5회 달성",
          name: "첫 신청곡",
        },
        { badgeCode: "B", description: null, name: "두 번째 칭호" },
      ],
    });
    expect(
      parseBadgeAwardEvent(
        JSON.stringify({
          roomSlug: "room",
          userSlug: "me",
          nickname: "나",
          badges: [{ badgeCode: "A", name: "구 계약" }],
        }),
      ),
    ).toBeNull();
  });

  it("description 원문을 보존하고 비어 있으면 칭호 조건으로 대체한다", () => {
    expect(
      getBadgeAchievementCopy({
        badgeCode: "A",
        description: "누적 큐잉 5회 달성",
        name: "첫 신청곡",
      }),
    ).toEqual({
      achievement: "누적 큐잉 5회 달성",
      award: "새로운 칭호를 획득했습니다!",
      encouragement: "더 열심히 참여해서 다음 칭호도 획득해보세요.",
    });
    expect(
      getBadgeAchievementCopy({
        badgeCode: "B",
        description: null,
        name: "첫 신청곡",
      }).achievement,
    ).toBe("'첫 신청곡' 칭호 조건을 달성했습니다.");
    expect(
      getBadgeAchievementCopy({
        badgeCode: "C",
        description: "첫 신청곡을 등록했어요.",
        name: "첫 신청곡",
      }).achievement,
    ).toBe("첫 신청곡을 등록했어요.");
  });
});
