import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import { useEditRoomForm } from "@/src/features/room/update/hooks/useEditRoomForm";
import EditRoomFormModal from "./EditRoomFormModal";

const mocks = vi.hoisted(() => ({
  deleteMutateAsync: vi.fn(),
  deleteReset: vi.fn(),
  notify: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/src/features/room/update/hooks/useEditRoomForm", () => ({
  useEditRoomForm: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/src/features/room/update/model/useDeleteRoom", () => ({
  useDeleteRoom: () => ({
    error: null,
    isPending: false,
    mutateAsync: mocks.deleteMutateAsync,
    reset: mocks.deleteReset,
  }),
}));
vi.mock("@/src/features/room/hooks/useRoomTags", () => ({
  useRoomTags: () => ({ data: [] }),
}));
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify: mocks.notify }),
}));

function mockEditForm() {
  vi.mocked(useEditRoomForm).mockReturnValue({
    canSubmit: true,
    clearThumbnailSelection: vi.fn(),
    handleSubmit: vi.fn(),
    handleThumbnailChange: vi.fn(),
    isPasswordChangeEnabled: false,
    isPasswordClearEnabled: false,
    isPasswordRequired: false,
    isSubmitting: false,
    isThumbnailPreviewUnavailable: false,
    maxParticipants: "",
    maxParticipantOptions: [2, 3, 4] as const,
    maxRoomTitleLength: 18,
    maxTags: 3,
    password: "",
    passwordInvalid: false,
    selectedTagSlugs: [],
    setPassword: vi.fn(),
    submitError: null,
    submitErrorPrefix: "수정 실패",
    tagsInvalid: false,
    thumbnailErrorMessage: null,
    thumbnailFileName: null,
    thumbnailPreviewUrl: null,
    thumbnailStatusMessage: null,
    title: "기존 방",
    titleInvalid: false,
    trackLimitMinutes: "",
    trackLimitMinuteOptions: [5, 10, 15] as const,
    toggleTag: vi.fn(),
    markThumbnailPreviewUnavailable: vi.fn(),
    updateMaxParticipants: vi.fn(),
    updatePasswordChangeEnabled: vi.fn(),
    updatePasswordClearEnabled: vi.fn(),
    updateTrackLimitMinutes: vi.fn(),
    updateTitle: vi.fn(),
  });
}

describe("EditRoomFormModal feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteMutateAsync.mockResolvedValue({ success: true });
    mockEditForm();
  });

  it("방 수정 오류를 인라인에 중복 노출하지 않는다", () => {
    vi.mocked(useEditRoomForm).mockReturnValue({
      canSubmit: true,
      clearThumbnailSelection: vi.fn(),
      handleSubmit: vi.fn(),
      handleThumbnailChange: vi.fn(),
      isPasswordChangeEnabled: false,
      isPasswordClearEnabled: false,
      isPasswordRequired: false,
      isSubmitting: false,
      isThumbnailPreviewUnavailable: false,
      maxParticipants: "",
      maxParticipantOptions: [2, 3, 4] as const,
      maxRoomTitleLength: 18,
      maxTags: 3,
      password: "",
      passwordInvalid: false,
      selectedTagSlugs: [],
      setPassword: vi.fn(),
      submitError: new ApiError({
        message: "방 정보를 저장하지 못했습니다.",
        status: 400,
      }),
      submitErrorPrefix: "수정 실패",
      tagsInvalid: false,
      thumbnailErrorMessage: null,
      thumbnailFileName: null,
      thumbnailPreviewUrl: null,
      thumbnailStatusMessage: null,
      title: "기존 방",
      titleInvalid: false,
      trackLimitMinutes: "",
      trackLimitMinuteOptions: [5, 10, 15] as const,
      toggleTag: vi.fn(),
      markThumbnailPreviewUnavailable: vi.fn(),
      updateMaxParticipants: vi.fn(),
      updatePasswordChangeEnabled: vi.fn(),
      updatePasswordClearEnabled: vi.fn(),
      updateTrackLimitMinutes: vi.fn(),
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

    expect(
      screen.queryByText("수정 실패: 방 정보를 저장하지 못했습니다."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("400")).not.toBeInTheDocument();
  });

  it("직접 방 삭제 성공은 실시간 삭제와 같은 key로 한 번 알린다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <EditRoomFormModal
        initialTitle="기존 방"
        onClose={onClose}
        open
        roomSlug="existing-room"
      />,
    );

    await user.click(screen.getByRole("button", { name: "방 삭제" }));
    await user.click(screen.getByRole("button", { name: "방 삭제하기" }));

    await waitFor(() => expect(mocks.deleteMutateAsync).toHaveBeenCalledOnce());
    expect(mocks.notify).toHaveBeenCalledWith({
      dedupeKey: "room-delete:existing-room",
      message: "'기존 방' 방을 삭제했습니다.",
      tone: "default",
    });
    expect(onClose).toHaveBeenCalledOnce();
    expect(mocks.replace).toHaveBeenCalledWith("/");
  });

  it("방 삭제 실패는 확인 모달을 유지하고 빨간 알림만 표시한다", async () => {
    const user = userEvent.setup();
    mocks.deleteMutateAsync.mockRejectedValueOnce(new Error("삭제 실패"));
    render(
      <EditRoomFormModal
        initialTitle="기존 방"
        onClose={vi.fn()}
        open
        roomSlug="existing-room"
      />,
    );

    await user.click(screen.getByRole("button", { name: "방 삭제" }));
    await user.click(screen.getByRole("button", { name: "방 삭제하기" }));

    await waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledWith({
        dedupeKey: "room-delete:existing-room",
        message: "삭제 실패",
        tone: "error",
      }),
    );
    expect(screen.getByRole("dialog", { name: "기존 방" })).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
