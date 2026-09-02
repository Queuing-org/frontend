import { describe, expect, it } from "vitest";
import type { PlaylistParticipant } from "@/src/features/playlist/model/types";
import type { User } from "@/src/features/user/model/types";
import {
  getCurrentParticipantFirst,
  includeCurrentParticipant,
  getParticipantIdentityKey,
  getParticipantKickTargetForUser,
  getParticipantUserSlug,
  isSameUser,
} from "./participantIdentity";

const participant = (
  overrides: Partial<PlaylistParticipant> = {},
): PlaylistParticipant => ({
  participantType: "USER",
  participantId: "participant-1",
  userSlug: "member",
  nickname: "같은닉네임",
  profileImageUrl: null,
  ...overrides,
});

describe("participantIdentity", () => {
  it("목록 key는 participantId, 회원 주소는 userSlug만 사용한다", () => {
    expect(getParticipantIdentityKey(participant())).toBe(
      "participant:participant-1",
    );
    expect(getParticipantUserSlug(participant())).toBe("member");
    expect(
      getParticipantUserSlug(
        participant({ participantId: "u_inferred", userSlug: null }),
      ),
    ).toBeNull();
    expect(
      getParticipantUserSlug({
        ...participant({ userSlug: null }),
        slug: "legacy-must-be-ignored",
      } as PlaylistParticipant & { slug: string }),
    ).toBeNull();
  });

  it("닉네임이 같아도 userSlug가 다르면 같은 회원으로 보지 않는다", () => {
    const me: User = {
      slug: "me",
      nickname: "같은닉네임",
      profileImageUrl: null,
      userId: 1,
    };
    expect(isSameUser(participant({ userSlug: "other" }), me)).toBe(false);
    expect(isSameUser(participant({ userSlug: "me" }), me)).toBe(true);
  });

  it("현재 사용자를 첫 번째로 옮기고 나머지 참가자 순서를 보존한다", () => {
    const participants = [
      participant({ participantId: "owner", userSlug: "owner" }),
      participant({ participantId: "me", userSlug: "me" }),
      participant({ participantId: "member", userSlug: "member" }),
    ];

    const ordered = getCurrentParticipantFirst(participants, { slug: "me" });

    expect(ordered.map(({ participantId }) => participantId)).toEqual([
      "me",
      "owner",
      "member",
    ]);
    expect(participants.map(({ participantId }) => participantId)).toEqual([
      "owner",
      "me",
      "member",
    ]);
  });

  it("현재 사용자가 없거나 이미 첫 번째면 기존 배열을 유지한다", () => {
    const participants = [
      participant({ participantId: "me", userSlug: "me" }),
      participant({ participantId: "member", userSlug: "member" }),
    ];

    expect(getCurrentParticipantFirst(participants, { slug: "me" })).toBe(
      participants,
    );
    expect(
      getCurrentParticipantFirst(participants, { slug: "missing" }),
    ).toBe(participants);
    expect(getCurrentParticipantFirst(participants, null)).toBe(participants);
  });

  it("현재 참가자가 조회 page 밖이면 앞에 포함하고 원본 page는 변경하지 않는다", () => {
    const pageParticipants = [
      participant({ participantId: "owner", userSlug: "owner" }),
      participant({ participantId: "member", userSlug: "member" }),
    ];
    const currentParticipant = participant({
      participantId: "me",
      userSlug: "me",
    });

    const included = includeCurrentParticipant(
      pageParticipants,
      currentParticipant,
    );

    expect(included.map(({ participantId }) => participantId)).toEqual([
      "me",
      "owner",
      "member",
    ]);
    expect(pageParticipants.map(({ participantId }) => participantId)).toEqual([
      "owner",
      "member",
    ]);
  });

  it("participantId 또는 회원 slug가 이미 있으면 현재 참가자를 중복하지 않는다", () => {
    const currentParticipant = participant({
      participantId: "me",
      userSlug: "me",
    });
    const sameParticipantId = [
      participant({ participantId: "me", userSlug: "renamed-me" }),
    ];
    const sameUserSlug = [
      participant({ participantId: "refetched-me", userSlug: "me" }),
    ];

    expect(includeCurrentParticipant(sameParticipantId, currentParticipant)).toBe(
      sameParticipantId,
    );
    expect(includeCurrentParticipant(sameUserSlug, currentParticipant)).toBe(
      sameUserSlug,
    );
  });

  it("현재 참가 중인 회원에게만 userSlug 기반 내보내기 대상을 만든다", () => {
    const participants = [participant({ userSlug: "active-user" })];

    expect(
      getParticipantKickTargetForUser(participants, { slug: "active-user" }),
    ).toEqual({ userSlug: "active-user" });
    expect(
      getParticipantKickTargetForUser(participants, { slug: "left-user" }),
    ).toBeNull();
  });
});
