import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/src/shared/api/api-error";
import { createRoom } from "@/src/features/room/api/createRoom";
import { uploadTemporaryRoomThumbnail } from "@/src/features/room/api/uploadTemporaryRoomThumbnail";
import RoomFormModal from "./RoomFormModal";

const { push, roomTags } = vi.hoisted(() => ({
  push: vi.fn(),
  roomTags: [] as Array<{ name: string; slug: string }>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));
vi.mock("@/src/features/room/api/createRoom", () => ({
  createRoom: vi.fn(),
}));
vi.mock("@/src/features/room/api/uploadTemporaryRoomThumbnail", () => ({
  uploadTemporaryRoomThumbnail: vi.fn(),
}));
vi.mock("@/src/features/room/hooks/useRoomTags", () => ({
  useRoomTags: () => ({ data: roomTags }),
}));

function renderCreateRoomModal() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RoomFormModal
        mode="create"
        onClose={vi.fn()}
        open
      />
    </QueryClientProvider>,
  );
}

function renderEditRoomModal(initialTagSlugs: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RoomFormModal
        initialTagSlugs={initialTagSlugs}
        initialTitle="기존 방"
        mode="edit"
        onClose={vi.fn()}
        open
        roomSlug="existing-room"
      />
    </QueryClientProvider>,
  );
}

async function selectThumbnail(fileName = "cover.png") {
  const input = document.getElementById(
    "create-room-thumbnail",
  ) as HTMLInputElement | null;
  const file = new File(["thumbnail"], fileName, { type: "image/png" });

  expect(input).not.toBeNull();
  await userEvent.upload(input!, file);

  return file;
}

describe("RoomFormModal room form flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roomTags.splice(0);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:thumbnail-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("파일 선택 즉시 업로드하고 실패를 인라인 표시한다", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadTemporaryRoomThumbnail).mockRejectedValue(
      new ApiError({
        code: "room.thumbnail-upload-limit-exceeded",
        message: "임시 이미지가 너무 많습니다.",
        status: 409,
      }),
    );
    renderCreateRoomModal();
    await user.type(screen.getByLabelText("방 제목"), "테스트 방");

    const file = await selectThumbnail();

    await waitFor(() => {
      expect(
        vi.mocked(uploadTemporaryRoomThumbnail).mock.calls[0]?.[0],
      ).toEqual({ file });
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "썸네일 업로드 실패: (409) 임시 이미지가 너무 많습니다.",
    );
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
  });

  it("업로드 중에는 제목 입력을 유지하고 단계 이동만 막는다", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadTemporaryRoomThumbnail).mockImplementation(
      () => new Promise(() => {}),
    );
    renderCreateRoomModal();

    await selectThumbnail();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "썸네일 업로드 중...",
    );
    const titleInput = screen.getByLabelText("방 제목");
    expect(titleInput).toBeEnabled();
    await user.type(titleInput, "업로드 중 입력");
    expect(titleInput).toHaveValue("업로드 중 입력");
    expect(document.getElementById("create-room-thumbnail")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "선택한 썸네일 제거" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
  });

  it("재선택한 파일 업로드가 성공하면 이전 오류를 지운다", async () => {
    vi.mocked(uploadTemporaryRoomThumbnail)
      .mockRejectedValueOnce(
        new ApiError({
          message: "지원하지 않는 이미지입니다.",
          status: 400,
        }),
      )
      .mockResolvedValueOnce({
        uploadToken: "rtu_retry",
        thumbnailUrl: "https://example.com/retry.png",
      });
    renderCreateRoomModal();

    await selectThumbnail("invalid.png");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "지원하지 않는 이미지입니다.",
    );

    const retryFile = await selectThumbnail("retry.png");

    expect(
      vi.mocked(uploadTemporaryRoomThumbnail).mock.lastCall?.[0],
    ).toEqual({ file: retryFile });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "썸네일 업로드 완료",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("성공한 uploadToken을 방 생성 payload에 포함한다", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadTemporaryRoomThumbnail).mockResolvedValue({
      uploadToken: "rtu_success",
      thumbnailUrl: "https://example.com/success.png",
    });
    vi.mocked(createRoom).mockResolvedValue({ slug: "created-room" });
    renderCreateRoomModal();

    await selectThumbnail();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "썸네일 업로드 완료",
    );
    await user.type(screen.getByLabelText("방 제목"), "토큰 방");
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "완료" }));

    await waitFor(() => {
      expect(vi.mocked(createRoom).mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          thumbnailUploadToken: "rtu_success",
          title: "토큰 방",
        }),
      );
    });
    expect(push).toHaveBeenCalledWith("/room/created-room");
  });

  it("업로드 성공 후 선택을 제거하면 token도 생성 payload에서 제외한다", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadTemporaryRoomThumbnail).mockResolvedValue({
      uploadToken: "rtu_removed",
      thumbnailUrl: "https://example.com/removed.png",
    });
    vi.mocked(createRoom).mockResolvedValue({ slug: "room-after-clear" });
    renderCreateRoomModal();

    await selectThumbnail();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "썸네일 업로드 완료",
    );
    await user.click(
      screen.getByRole("button", { name: "선택한 썸네일 제거" }),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("방 제목"), "선택 제거 방");
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "완료" }));

    await waitFor(() => {
      expect(createRoom).toHaveBeenCalledOnce();
    });
    expect(vi.mocked(createRoom).mock.calls[0]?.[0]).not.toHaveProperty(
      "thumbnailUploadToken",
    );
  });

  it("썸네일을 선택하지 않으면 token 없이 방을 생성한다", async () => {
    const user = userEvent.setup();
    vi.mocked(createRoom).mockResolvedValue({ slug: "room-without-thumbnail" });
    renderCreateRoomModal();

    await user.type(screen.getByLabelText("방 제목"), "기본 방");
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "완료" }));

    await waitFor(() => {
      expect(createRoom).toHaveBeenCalledOnce();
    });
    expect(vi.mocked(createRoom).mock.calls[0]?.[0]).not.toHaveProperty(
      "thumbnailUploadToken",
    );
    expect(uploadTemporaryRoomThumbnail).not.toHaveBeenCalled();
  });

  it("태그를 최대 3개까지 선택하고 생성 payload에 반영한다", async () => {
    const user = userEvent.setup();
    roomTags.push(
      { name: "록", slug: "rock" },
      { name: "재즈", slug: "jazz" },
      { name: "팝", slug: "pop" },
      { name: "힙합", slug: "hip-hop" },
    );
    vi.mocked(createRoom).mockResolvedValue({ slug: "three-tag-room" });
    renderCreateRoomModal();

    await user.type(screen.getByLabelText("방 제목"), "태그 세 개 방");
    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.getByText("0/3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "록" }));
    await user.click(screen.getByRole("button", { name: "재즈" }));
    await user.click(screen.getByRole("button", { name: "팝" }));

    expect(screen.getByText("3/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "힙합" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "완료" }));

    await waitFor(() => {
      expect(vi.mocked(createRoom).mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          tags: ["rock", "jazz", "pop"],
        }),
      );
    });
  });

  it("수정 UI도 3개 카운터와 미선택 태그 비활성화를 적용한다", async () => {
    const user = userEvent.setup();
    roomTags.push(
      { name: "록", slug: "rock" },
      { name: "재즈", slug: "jazz" },
      { name: "팝", slug: "pop" },
      { name: "힙합", slug: "hip-hop" },
    );
    renderEditRoomModal(["rock", "jazz", "pop"]);

    expect(screen.getByText("3/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "힙합" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "팝" }));

    expect(screen.getByText("2/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "힙합" })).toBeEnabled();
  });
});
