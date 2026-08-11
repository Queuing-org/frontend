import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import { useEditRoomForm } from "@/src/features/room/update/hooks/useEditRoomForm";
import EditRoomFormModal from "./EditRoomFormModal";

vi.mock("@/src/features/room/update/hooks/useEditRoomForm", () => ({
  useEditRoomForm: vi.fn(),
}));
vi.mock("@/src/features/room/hooks/useRoomTags", () => ({
  useRoomTags: () => ({ data: [] }),
}));

describe("EditRoomFormModal feedback", () => {
  it("방 수정 오류에서 HTTP 상태 코드를 사용자에게 노출하지 않는다", () => {
    vi.mocked(useEditRoomForm).mockReturnValue({
      canSubmit: true,
      clearMaxParticipants: vi.fn(),
      handleSubmit: vi.fn(),
      isPasswordChangeEnabled: false,
      isPasswordClearEnabled: false,
      isPasswordRequired: false,
      isSubmitting: false,
      maxParticipants: "",
      maxParticipantsError: null,
      maxParticipantsLimit: 250,
      maxRoomTitleLength: 255,
      maxTags: 3,
      password: "",
      selectedTagSlugs: [],
      setPassword: vi.fn(),
      submitError: new ApiError({
        message: "방 정보를 저장하지 못했습니다.",
        status: 400,
      }),
      title: "기존 방",
      toggleTag: vi.fn(),
      updateMaxParticipants: vi.fn(),
      updatePasswordChangeEnabled: vi.fn(),
      updatePasswordClearEnabled: vi.fn(),
      updateTitle: vi.fn(),
    });

    render(
      <EditRoomFormModal
        initialTitle="기존 방"
        onClose={vi.fn()}
        open
        roomSlug="existing-room"
      />,
    );

    const error = screen.getByText(
      "수정 실패: 방 정보를 저장하지 못했습니다.",
    );
    expect(error).not.toHaveTextContent("400");
  });
});
