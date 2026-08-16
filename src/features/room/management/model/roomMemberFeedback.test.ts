import { describe, expect, it } from "vitest";
import {
  getRoomMemberFailureMessage,
  getRoomMemberFeedbackKey,
  getRoomMemberSuccessMessage,
} from "./roomMemberFeedback";

describe("room member feedback", () => {
  it("진입 화면과 무관하게 동일한 key와 문구를 만든다", () => {
    expect(getRoomMemberFeedbackKey("kick", "test-room", "target"))
      .toBe("room-member:kick:test-room:target");
    expect(getRoomMemberSuccessMessage("kick", "민수"))
      .toBe("'민수'님을 방에서 내보냈습니다.");
    expect(getRoomMemberSuccessMessage("transfer", "민수"))
      .toBe("'민수'님에게 방장을 위임했습니다!");
  });

  it("서버 문구를 우선하고 없으면 액션별 fallback을 사용한다", () => {
    expect(getRoomMemberFailureMessage("kick", "서버 오류")).toBe("서버 오류");
    expect(getRoomMemberFailureMessage("transfer", "")).toBe(
      "방장을 위임하지 못했습니다.",
    );
  });
});
