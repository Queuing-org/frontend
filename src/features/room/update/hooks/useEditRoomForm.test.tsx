import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FormEvent, PropsWithChildren } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import { updateRoom } from "@/src/features/room/api/updateRoom";
import { updateRoomThumbnail } from "@/src/features/room/api/updateRoomThumbnail";
import { uploadTemporaryRoomThumbnail } from "@/src/features/room/api/uploadTemporaryRoomThumbnail";
import { useEditRoomForm } from "./useEditRoomForm";

const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock("@/src/features/room/api/updateRoom", () => ({
  updateRoom: vi.fn(),
}));
vi.mock("@/src/features/room/api/updateRoomThumbnail", () => ({
  updateRoomThumbnail: vi.fn(),
}));
vi.mock("@/src/features/room/api/uploadTemporaryRoomThumbnail", () => ({
  uploadTemporaryRoomThumbnail: vi.fn(),
}));
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

it("수정 폼의 초기 태그와 추가 선택을 최대 3개로 제한한다", () => {
  const { result } = renderHook(
    () =>
      useEditRoomForm({
        initialHasPassword: false,
        initialMaxParticipants: null,
        initialTagSlugs: ["rock", "jazz", "pop", "hip-hop"],
        initialTitle: "기존 방",
        onClose: vi.fn(),
        roomSlug: "existing-room",
      }),
    { wrapper: createWrapper() },
  );

  expect(result.current.maxTags).toBe(3);
  expect(result.current.selectedTagSlugs).toEqual(["rock", "jazz", "pop"]);

  act(() => {
    result.current.toggleTag("hip-hop");
  });
  expect(result.current.selectedTagSlugs).toEqual(["rock", "jazz", "pop"]);

  act(() => {
    result.current.toggleTag("pop");
    result.current.toggleTag("hip-hop");
  });
  expect(result.current.selectedTagSlugs).toEqual(["rock", "jazz", "hip-hop"]);
});

it("장르 없이 제출하면 fieldset 오류와 빨간 공통 알림을 함께 표시한다", async () => {
  const { result } = renderHook(
    () =>
      useEditRoomForm({
        initialHasPassword: false,
        initialMaxParticipants: null,
        initialTagSlugs: [],
        initialTitle: "기존 방",
        onClose: vi.fn(),
        roomSlug: "existing-room",
      }),
    { wrapper: createWrapper() },
  );

  await act(() =>
    result.current.handleSubmit({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>),
  );

  expect(result.current.tagsInvalid).toBe(true);
  expect(notify).toHaveBeenCalledWith({
    dedupeKey: "room-update:existing-room:tags",
    message: "장르를 하나 이상 선택해 주세요.",
    tone: "error",
  });
  expect(updateRoom).not.toHaveBeenCalled();

  act(() => result.current.toggleTag("rock"));
  expect(result.current.tagsInvalid).toBe(false);
});

it("수정한 필드의 검증 오류만 해제한다", async () => {
  const { result } = renderHook(
    () =>
      useEditRoomForm({
        initialHasPassword: false,
        initialMaxParticipants: null,
        initialTagSlugs: [],
        initialTitle: "",
        onClose: vi.fn(),
        roomSlug: "existing-room",
      }),
    { wrapper: createWrapper() },
  );

  await act(() =>
    result.current.handleSubmit({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>),
  );
  expect(result.current.titleInvalid).toBe(true);
  expect(result.current.tagsInvalid).toBe(true);

  act(() => result.current.toggleTag("rock"));
  expect(result.current.titleInvalid).toBe(true);
  expect(result.current.tagsInvalid).toBe(false);

  act(() => result.current.updateTitle("수정된 방"));
  expect(result.current.titleInvalid).toBe(false);
});

it("잘못된 썸네일은 필드 오류와 빨간 공통 알림을 함께 표시한다", async () => {
  const { result } = renderHook(
    () =>
      useEditRoomForm({
        initialHasPassword: false,
        initialMaxParticipants: null,
        initialTagSlugs: ["rock"],
        initialTitle: "기존 방",
        onClose: vi.fn(),
        roomSlug: "existing-room",
      }),
    { wrapper: createWrapper() },
  );
  const file = new File(["thumbnail"], "invalid.gif", {
    type: "image/gif",
  });
  const files = {
    0: file,
    length: 1,
    item: (index: number) => (index === 0 ? file : null),
  } as FileList;

  act(() => result.current.handleThumbnailChange(files));
  await waitFor(() => expect(result.current.thumbnailErrorMessage).toBeTruthy());
  await act(() =>
    result.current.handleSubmit({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>),
  );

  expect(notify).toHaveBeenCalledWith({
    dedupeKey: "room-update:existing-room:thumbnail",
    message: "jpg, png, webp, heic 파일만 업로드할 수 있습니다.",
    tone: "error",
  });
  expect(updateRoom).not.toHaveBeenCalled();
});

it("일반 정보 저장 후 썸네일 교체가 실패하면 재시도에서 PATCH를 중복 호출하지 않는다", async () => {
  const onClose = vi.fn();
  vi.mocked(uploadTemporaryRoomThumbnail).mockResolvedValue({
    uploadToken: "rtu_edit",
    thumbnailUrl: "https://example.com/edit.png",
  });
  vi.mocked(updateRoom).mockResolvedValue({ success: true });
  vi.mocked(updateRoomThumbnail)
    .mockRejectedValueOnce(
      new ApiError({ message: "교체 실패", status: 409 }),
    )
    .mockRejectedValueOnce(
      new ApiError({ message: "교체 재시도 실패", status: 409 }),
    )
    .mockResolvedValueOnce({ success: true });
  const { result } = renderHook(
    () =>
      useEditRoomForm({
        initialHasPassword: false,
        initialMaxParticipants: 10,
        initialTagSlugs: ["rock"],
        initialTitle: "기존 방",
        onClose,
        roomSlug: "existing-room",
      }),
    { wrapper: createWrapper() },
  );
  const file = new File(["thumbnail"], "edit.png", { type: "image/png" });
  const files = {
    0: file,
    length: 1,
    item: (index: number) => (index === 0 ? file : null),
  } as FileList;

  act(() => {
    result.current.updateTitle("수정된 방");
    result.current.handleThumbnailChange(files);
  });
  await waitFor(() => expect(result.current.canSubmit).toBe(true));

  await act(async () => {
    await result.current.handleSubmit({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>);
  });

  expect(updateRoom).toHaveBeenCalledOnce();
  expect(updateRoomThumbnail).toHaveBeenCalledOnce();
  expect(result.current.submitErrorPrefix).toBe(
    "방 정보는 저장됐지만 썸네일 교체 실패",
  );
  expect(onClose).not.toHaveBeenCalled();
  expect(notify).toHaveBeenCalledWith({
    dedupeKey: "room-update:existing-room",
    message: "방 정보는 저장했지만 썸네일을 변경하지 못했습니다.",
    tone: "error",
  });

  await act(async () => {
    await result.current.handleSubmit({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>);
  });

  expect(updateRoom).toHaveBeenCalledOnce();
  expect(updateRoomThumbnail).toHaveBeenCalledTimes(2);
  expect(onClose).not.toHaveBeenCalled();
  expect(notify).toHaveBeenLastCalledWith({
    dedupeKey: "room-update:existing-room",
    message: "방 정보는 저장했지만 썸네일을 변경하지 못했습니다.",
    tone: "error",
  });

  await act(async () => {
    await result.current.handleSubmit({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>);
  });

  expect(updateRoom).toHaveBeenCalledOnce();
  expect(updateRoomThumbnail).toHaveBeenCalledTimes(3);
  expect(onClose).toHaveBeenCalledOnce();
});
