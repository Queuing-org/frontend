import { describe, expect, it } from "vitest";
import { createTestQueryClient } from "@/src/shared/test/queryClient";
import {
  applyChatNicknames,
  applyNickname,
  createRoomNicknameSession,
} from "./roomParticipantNicknames";
import type { ChatMessage, WsEvent } from "./types";

const event = (
  timestamp = 200,
  nickname = "새 이름",
  userSlug = "user",
): WsEvent => ({
  type: "ROOM_PARTICIPANT_NICKNAME_CHANGED",
  roomSlug: "room",
  timestamp,
  data: { userSlug, nickname },
});
const identity = { slug: "user", nickname: "옛 이름" };
const entry = { entryId: "entry", addedBy: identity };

describe("room nickname session", () => {
  it("모든 참가자·큐 페이지, 현재 곡, 방장, 열린 프로필과 본인 캐시를 즉시 갱신한다", () => {
    const qc = createTestQueryClient();
    const keys = [
      ["roomParticipants", "room"],
      ["roomQueue", "room", "mine"],
      ["roomQueue", "room", "all"],
      ["roomPlayback", "room"],
      ["roomMeta", "room"],
      ["userProfile", "user"],
      ["me"],
    ];
    const participant = { userSlug: "user", nickname: "옛 이름" };
    const data = [
      {
        pages: [{ items: [participant] }, { items: [participant] }],
        pageParams: [null, "cursor"],
      },
      {
        pages: [{ items: [entry] }, { items: [entry] }],
        pageParams: [null, "cursor"],
      },
      { pages: [{ items: [entry] }], pageParams: [null] },
      { currentEntry: entry },
      { owner: identity },
      identity,
      identity,
    ];
    keys.forEach((key, i) => qc.setQueryData(key, data[i]));
    qc.setQueryData(["roomMeta", "other"], { owner: identity });
    const session = createRoomNicknameSession(qc, "room");
    const detach = session.attach();
    expect(session.accept(event())).toBe(true);
    keys.forEach((key) => {
      expect(JSON.stringify(qc.getQueryData(key))).toContain("새 이름");
      expect(JSON.stringify(qc.getQueryData(key))).not.toContain("옛 이름");
    });
    expect(qc.getQueryData(["roomMeta", "other"])).toEqual({ owner: identity });
    expect(
      applyNickname(participant, "user", session.getSnapshot()).nickname,
    ).toBe("새 이름");
    detach();
    qc.clear();
  });

  it("중복·역순·잘못된 이벤트를 무시하고 이후 REST와 추가 페이지의 늦은 이름도 보정한다", () => {
    const qc = createTestQueryClient();
    const session = createRoomNicknameSession(qc, "room");
    const detach = session.attach();
    session.accept(event());
    for (const bad of [
      event(100, "과거"),
      event(200, "중복"),
      event(NaN),
      event(Infinity),
      event(0),
      event(201, " "),
      event(201, "이름", " "),
      { ...event(300), roomSlug: "other" },
    ])
      expect(session.accept(bad)).toBe(false);
    qc.setQueryData(["roomQueue", "room", "mine"], {
      pages: [{ items: [entry] }, { items: [entry] }],
      pageParams: [null, "next"],
    });
    expect(
      JSON.stringify(qc.getQueryData(["roomQueue", "room", "mine"])),
    ).not.toContain("옛 이름");
    expect(session.accept(event(300, "최신"))).toBe(true);
    qc.setQueryData(["userProfile", "user"], identity);
    expect(qc.getQueryData(["userProfile", "user"])).toEqual({
      ...identity,
      nickname: "최신",
    });
    session.clear();
    qc.setQueryData(["userProfile", "user"], identity);
    expect(session.getSnapshot().size).toBe(0);
    expect(qc.getQueryData(["userProfile", "user"])).toEqual(identity);
    detach();
    qc.clear();
  });

  it("진행 중인 조회를 취소하여 늦게 resolve한 결과가 이름을 되돌리지 못한다", async () => {
    const qc = createTestQueryClient();
    let resolve!: (value: typeof identity) => void;
    let signal!: AbortSignal;
    const pending = qc
      .fetchQuery({
        queryKey: ["userProfile", "user"],
        queryFn: (context) => {
          signal = context.signal;
          return new Promise<typeof identity>((done) => {
            resolve = done;
          });
        },
      })
      .catch(() => undefined);
    const session = createRoomNicknameSession(qc, "room");
    const detach = session.attach();
    session.accept(event());
    expect(signal.aborted).toBe(true);
    resolve(identity);
    await pending;
    expect(qc.getQueryData(["userProfile", "user"])).toBeUndefined();
    detach();
    qc.clear();
  });

  it("현재·추가 로딩 채팅은 이름만 바꾸고 원문·식별자·삭제 상태를 보존한다", () => {
    const qc = createTestQueryClient();
    const session = createRoomNicknameSession(qc, "room");
    session.accept(event());
    const message: ChatMessage = {
      messageId: 1,
      messageKey: "stable",
      messageType: "TEXT",
      content: "삭제된 내용",
      senderSlug: "user",
      senderNickname: "옛 이름",
      senderProfileImageUrl: null,
      sentAt: 1,
      isDeleted: true,
    };
    const displayed = applyChatNicknames(
      [message, { ...message, messageId: 2 }],
      session.getSnapshot(),
    );
    expect(displayed[0]).toEqual({ ...message, senderNickname: "새 이름" });
    expect(displayed[1].senderNickname).toBe("새 이름");
    expect(message.senderNickname).toBe("옛 이름");
    expect(
      applyChatNicknames(
        [{ ...message, senderSlug: null }],
        session.getSnapshot(),
      )[0].senderNickname,
    ).toBe("옛 이름");
    qc.clear();
  });
});
