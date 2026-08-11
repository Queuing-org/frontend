import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FormEvent, PropsWithChildren } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import { updateRoom } from "@/src/features/room/api/updateRoom";
import { updateRoomThumbnail } from "@/src/features/room/api/updateRoomThumbnail";
import { uploadTemporaryRoomThumbnail } from "@/src/features/room/api/uploadTemporaryRoomThumbnail";
import { useEditRoomForm } from "./useEditRoomForm";

vi.mock("@/src/features/room/api/updateRoom", () => ({
  updateRoom: vi.fn(),
}));
vi.mock("@/src/features/room/api/updateRoomThumbnail", () => ({
  updateRoomThumbnail: vi.fn(),
}));
vi.mock("@/src/features/room/api/uploadTemporaryRoomThumbnail", () => ({
  uploadTemporaryRoomThumbnail: vi.fn(),
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

  await act(async () => {
    await result.current.handleSubmit({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>);
  });

  expect(updateRoom).toHaveBeenCalledOnce();
  expect(updateRoomThumbnail).toHaveBeenCalledTimes(2);
  expect(onClose).toHaveBeenCalledOnce();
});
