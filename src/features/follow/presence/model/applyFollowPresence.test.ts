import { describe, expect, it } from "vitest";
import { applyPresenceToList } from "./applyFollowPresence";

const list = {
  items: [
    {
      cursorId: 1,
      nickname: "민지",
      slug: "minji",
      profileImageUrl: null,
      online: true,
      room: null,
      presenceVersion: 42,
    },
  ],
  hasNext: false,
  nextCursor: null,
};

describe("follow presence 버전 처리", () => {
  it("REST 버전보다 큰 이벤트만 반영한다", () => {
    const stale = applyPresenceToList(list, {
      type: "USER_PRESENCE_CHANGED",
      data: {
        userSlug: "minji",
        online: false,
        room: null,
        version: 41,
      },
    });
    expect(stale?.items[0]).toEqual(list.items[0]);

    const fresh = applyPresenceToList(list, {
      type: "USER_PRESENCE_CHANGED",
      data: {
        userSlug: "minji",
        online: true,
        room: { slug: "jazz", title: "재즈 방" },
        version: 43,
      },
    });
    expect(fresh?.items[0]).toMatchObject({
      presenceVersion: 43,
      room: { slug: "jazz", title: "재즈 방" },
    });
  });

  it("REST presence 필드가 빠져도 최초 실시간 이벤트를 적용한다", () => {
    const withoutPresence = {
      ...list,
      items: [
        {
          cursorId: 2,
          nickname: "지수",
          profileImageUrl: null,
          slug: "jisoo",
        },
      ],
    };

    const next = applyPresenceToList(withoutPresence, {
      type: "USER_PRESENCE_CHANGED",
      data: {
        userSlug: "jisoo",
        online: true,
        room: { slug: "pop", title: "팝 방" },
        version: 1,
      },
    });

    expect(next?.items[0]).toMatchObject({
      online: true,
      presenceVersion: 1,
      room: { slug: "pop", title: "팝 방" },
    });
  });
});
