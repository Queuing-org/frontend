import { describe, expect, it } from "vitest";
import {
  enqueueUnseenBadgeAwards,
  formatBadgeAwardCopy,
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

  it("description을 trim한 뒤 정확한 두 문장으로 조합한다", () => {
    expect(formatBadgeAwardCopy("  5회 채팅을 달성  ")).toEqual({
      achievement: "5회 채팅을 달성하여 새로운 칭호를 획득했습니다!",
      encouragement: "더 열심히 참여해서 다음 칭호도 획득해보세요.",
    });
  });

  it.each([null, "   "])(
    "description이 %j이면 획득 문장만 표시한다",
    (description) => {
      expect(formatBadgeAwardCopy(description)).toEqual({
        achievement: "새로운 칭호를 획득했습니다!",
        encouragement: "더 열심히 참여해서 다음 칭호도 획득해보세요.",
      });
    },
  );
});
