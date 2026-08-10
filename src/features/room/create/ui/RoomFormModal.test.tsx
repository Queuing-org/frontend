import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

async function selectRequiredMaxParticipants(
  user: ReturnType<typeof userEvent.setup>,
  value = "10",
) {
  await user.selectOptions(screen.getByLabelText("최대 인원 수"), value);
}

function uploadResult(uploadToken: string, thumbnailUrl: string) {
  return {
    uploadToken,
    thumbnailUrl,
    thumbnailUrls: null,
    contentType: "image/png",
    sizeBytes: 9,
    width: 100,
    height: 100,
    expiresAt: "2026-08-02T08:00:00Z",
  };
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
      "썸네일 업로드 실패: 임시 이미지가 너무 많습니다.",
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

    expect(
      await screen.findByRole("status", { name: "썸네일 업로드 중" }),
    ).toBeInTheDocument();
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
      .mockResolvedValueOnce(
        uploadResult("rtu_retry", "https://example.com/retry.png"),
      );
    renderCreateRoomModal();

    await selectThumbnail("invalid.png");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "지원하지 않는 이미지입니다.",
    );

    const retryFile = await selectThumbnail("retry.png");

    expect(
      vi.mocked(uploadTemporaryRoomThumbnail).mock.lastCall?.[0],
    ).toEqual({ file: retryFile });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "선택한 썸네일 제거" }),
      ).toBeEnabled();
    });
    expect(screen.queryByText("썸네일 업로드 완료")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("성공한 uploadToken을 방 생성 payload에 포함한다", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadTemporaryRoomThumbnail).mockResolvedValue(
      uploadResult("rtu_success", "https://example.com/success.png"),
    );
    vi.mocked(createRoom).mockResolvedValue({ slug: "created-room" });
    renderCreateRoomModal();

    await selectThumbnail();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "선택한 썸네일 제거" }),
      ).toBeEnabled();
    });
    expect(screen.queryByText("썸네일 업로드 완료")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("방 제목"), "토큰 방");
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "다음" }));
    await selectRequiredMaxParticipants(user);
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
    vi.mocked(uploadTemporaryRoomThumbnail).mockResolvedValue(
      uploadResult("rtu_removed", "https://example.com/removed.png"),
    );
    vi.mocked(createRoom).mockResolvedValue({ slug: "room-after-clear" });
    renderCreateRoomModal();

    await selectThumbnail();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "선택한 썸네일 제거" }),
      ).toBeEnabled();
    });
    await user.click(
      screen.getByRole("button", { name: "선택한 썸네일 제거" }),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("방 제목"), "선택 제거 방");
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "다음" }));
    await selectRequiredMaxParticipants(user);
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
    await selectRequiredMaxParticipants(user);
    await user.click(screen.getByRole("button", { name: "완료" }));

    await waitFor(() => {
      expect(createRoom).toHaveBeenCalledOnce();
    });
    expect(vi.mocked(createRoom).mock.calls[0]?.[0]).not.toHaveProperty(
      "thumbnailUploadToken",
    );
    expect(uploadTemporaryRoomThumbnail).not.toHaveBeenCalled();
  });

  it("방 생성 오류에서 HTTP 상태 코드를 사용자에게 노출하지 않는다", async () => {
    const user = userEvent.setup();
    vi.mocked(createRoom).mockRejectedValue(
      new ApiError({ message: "서버가 방을 만들지 못했습니다.", status: 500 }),
    );
    renderCreateRoomModal();

    await user.type(screen.getByLabelText("방 제목"), "실패 방");
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "다음" }));
    await selectRequiredMaxParticipants(user);
    await user.click(screen.getByRole("button", { name: "완료" }));

    const error = await screen.findByText(
      "생성 실패: 서버가 방을 만들지 못했습니다.",
    );
    expect(error).not.toHaveTextContent("500");
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
    await selectRequiredMaxParticipants(user);
    await user.click(screen.getByRole("button", { name: "완료" }));

    await waitFor(() => {
      expect(vi.mocked(createRoom).mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          tags: ["rock", "jazz", "pop"],
        }),
      );
    });
  });

  it("필수 최대 인원은 정해진 옵션만 제공하고 미선택 생성을 막는다", async () => {
    const user = userEvent.setup();
    vi.mocked(createRoom).mockResolvedValue({ slug: "required-capacity-room" });
    renderCreateRoomModal();

    await user.type(screen.getByLabelText("방 제목"), "인원 필수 방");
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "다음" }));

    const maxParticipantsSelect = screen.getByLabelText("최대 인원 수");
    expect(maxParticipantsSelect).toHaveValue("");
    expect(maxParticipantsSelect).toBeRequired();
    expect(
      within(maxParticipantsSelect).getAllByRole("option").map((option) => ({
        text: option.textContent,
        value: (option as HTMLOptionElement).value,
      })),
    ).toEqual([
      { text: "최대 인원 선택", value: "" },
      ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(
        (participants) => ({
          text: `${participants}명`,
          value: String(participants),
        }),
      ),
    ]);
    expect(within(maxParticipantsSelect).queryByText("제한 없음")).toBeNull();

    await user.click(screen.getByRole("button", { name: "완료" }));
    expect(screen.getByText("최대 인원을 선택해주세요.")).toBeInTheDocument();
    expect(createRoom).not.toHaveBeenCalled();

    await selectRequiredMaxParticipants(user, "20");
    await user.click(screen.getByRole("button", { name: "완료" }));
    await waitFor(() => expect(createRoom).toHaveBeenCalledOnce());
    expect(vi.mocked(createRoom).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ maxParticipants: 20 }),
    );
  });

  it("참여 제한 메뉴는 화살표로 열고 Escape와 바깥 클릭으로 닫는다", async () => {
    const user = userEvent.setup();
    renderCreateRoomModal();

    await user.type(screen.getByLabelText("방 제목"), "메뉴 테스트 방");
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "다음" }));

    await user.click(screen.getByLabelText("참여 제한"));
    expect(screen.queryByRole("group", { name: "참여 제한 옵션" })).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "참여 제한 옵션 열기" });
    await user.click(toggle);
    expect(screen.getByRole("group", { name: "참여 제한 옵션" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "누구나 참여", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "비밀번호 입력", pressed: false })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("group", { name: "참여 제한 옵션" })).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();

    await user.click(toggle);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("group", { name: "참여 제한 옵션" })).not.toBeInTheDocument();
  });

  it("공개 전환 중 비밀번호를 보존하고 공개 payload에서는 제외한다", async () => {
    const user = userEvent.setup();
    vi.mocked(createRoom).mockResolvedValue({ slug: "public-room" });
    renderCreateRoomModal();

    await user.type(screen.getByLabelText("방 제목"), "비밀번호 보존 방");
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "다음" }));
    await selectRequiredMaxParticipants(user);

    const toggle = screen.getByRole("button", { name: "참여 제한 옵션 열기" });
    await user.click(toggle);
    await user.click(screen.getByRole("button", { name: "비밀번호 입력" }));
    await user.type(screen.getByLabelText("참여 제한"), "secret");

    await user.click(toggle);
    await user.click(screen.getByRole("button", { name: "누구나 참여" }));
    expect(screen.getByLabelText("참여 제한")).toHaveValue("누구나 참여");

    await user.click(toggle);
    await user.click(screen.getByRole("button", { name: "비밀번호 입력" }));
    expect(screen.getByLabelText("참여 제한")).toHaveValue("secret");

    await user.click(toggle);
    await user.click(screen.getByRole("button", { name: "누구나 참여" }));
    await user.click(screen.getByRole("button", { name: "완료" }));

    await waitFor(() => expect(createRoom).toHaveBeenCalledOnce());
    expect(vi.mocked(createRoom).mock.calls[0]?.[0]).not.toHaveProperty("password");
  });

  it("비밀번호 모드 payload에는 보존한 비밀번호를 포함한다", async () => {
    const user = userEvent.setup();
    vi.mocked(createRoom).mockResolvedValue({ slug: "password-room" });
    renderCreateRoomModal();

    await user.type(screen.getByLabelText("방 제목"), "비밀번호 방");
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "다음" }));
    await selectRequiredMaxParticipants(user);
    await user.click(screen.getByRole("button", { name: "참여 제한 옵션 열기" }));
    await user.click(screen.getByRole("button", { name: "비밀번호 입력" }));
    await user.type(screen.getByLabelText("참여 제한"), "secret");
    await user.click(screen.getByRole("button", { name: "완료" }));

    await waitFor(() => expect(createRoom).toHaveBeenCalledOnce());
    expect(vi.mocked(createRoom).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ password: "secret" }),
    );
  });

  it("방문한 3단계에서 2단계와 1단계를 거쳐 돌아와도 모든 입력값을 유지한다", async () => {
    const user = userEvent.setup();
    roomTags.push({ name: "록", slug: "rock" });
    renderCreateRoomModal();

    await user.type(screen.getByLabelText("방 제목"), "단계 보존 방");
    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "록" }));
    await user.click(screen.getByRole("button", { name: "다음" }));
    await selectRequiredMaxParticipants(user, "20");
    await user.selectOptions(screen.getByLabelText("곡 당 제한 시간"), "30");
    await user.click(screen.getByRole("button", { name: "참여 제한 옵션 열기" }));
    await user.click(screen.getByRole("button", { name: "비밀번호 입력" }));
    await user.type(screen.getByLabelText("참여 제한"), "secret");

    await user.click(screen.getByRole("button", { name: /장르 선택/ }));
    expect(screen.getByRole("button", { name: "록" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: /세부 설정/ }));
    expect(screen.getByLabelText("최대 인원 수")).toHaveValue("20");
    expect(screen.getByLabelText("곡 당 제한 시간")).toHaveValue("30");
    expect(screen.getByLabelText("참여 제한")).toHaveValue("secret");

    await user.click(screen.getByRole("button", { name: /기본 정보/ }));
    expect(screen.getByLabelText("방 제목")).toHaveValue("단계 보존 방");
    await user.click(screen.getByRole("button", { name: /세부 설정/ }));
    expect(screen.getByLabelText("최대 인원 수")).toHaveValue("20");
    expect(screen.getByLabelText("곡 당 제한 시간")).toHaveValue("30");
    expect(screen.getByLabelText("참여 제한")).toHaveValue("secret");
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
    expect(document.getElementById("edit-room-thumbnail")).toBeNull();
    expect(screen.queryByText("THUMBNAIL")).not.toBeInTheDocument();
  });
});
