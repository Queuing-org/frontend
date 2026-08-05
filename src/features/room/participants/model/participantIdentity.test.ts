import { describe, expect, it } from "vitest";
import type { PlaylistParticipant } from "@/src/features/playlist/model/types";
import type { User } from "@/src/features/user/model/types";
import {
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
