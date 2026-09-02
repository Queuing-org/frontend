import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AddTrackFormFields from "./AddTrackFormFields";

function renderFields(
  errorField: "url" | "queueMode" | "story",
  options: {
    playlistDetected?: boolean;
    singleTrackAvailable?: boolean;
  } = {},
) {
  const onQueueModeChange = vi.fn();
  render(
    <AddTrackFormFields
      errorField={errorField}
      errorMessage="입력을 확인해 주세요."
      onChange={vi.fn()}
      onQueueModeChange={onQueueModeChange}
      onStoryChange={vi.fn()}
      playlistDetected={options.playlistDetected ?? false}
      queueMode={null}
      singleTrackAvailable={options.singleTrackAvailable ?? false}
      storyLength={0}
      storyMaxLength={30}
      storyValue=""
      submitting={false}
      value=""
    />,
  );
  return { onQueueModeChange };
}

describe("AddTrackFormFields", () => {
  it("신청 사연을 노래 선정 이유로 안내한다", () => {
    renderFields("url");

    expect(screen.getByText("노래 선정 이유 (선택)")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "이 노래를 선정한 이유나 전하고 싶은 말을 적어주세요",
      ),
    ).toBeInTheDocument();
  });

  it("영상과 재생목록 URL을 모두 지원한다고 안내한다", () => {
    renderFields("url");

    expect(
      screen.getByPlaceholderText(
        "함께 듣고 싶은 영상 또는 재생목록 URL을 붙여넣으세요",
      ),
    ).toBeInTheDocument();
  });

  it("URL 오류를 URL 입력의 aria-invalid와 SR 설명에 연결한다", () => {
    renderFields("url");

    const input = screen.getByPlaceholderText(
      "함께 듣고 싶은 영상 또는 재생목록 URL을 붙여넣으세요",
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "add-track-error");
  });

  it("사연 오류를 사연 입력의 aria-invalid와 SR 설명에 연결한다", () => {
    renderFields("story");

    const textarea = screen.getByPlaceholderText(
      "이 노래를 선정한 이유나 전하고 싶은 말을 적어주세요",
    );
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute("aria-describedby", "add-track-error");
  });

  it("시청 재생목록은 현재 영상과 전체 재생목록 선택을 표시한다", () => {
    const { onQueueModeChange } = renderFields("queueMode", {
      playlistDetected: true,
      singleTrackAvailable: true,
    });

    const currentVideo = screen.getByRole("radio", {
      name: "현재 영상만 추가",
    });
    const wholePlaylist = screen.getByRole("radio", {
      name: /재생목록 노래도 함께 추가/,
    });
    expect(currentVideo).toBeEnabled();
    expect(wholePlaylist).toBeEnabled();

    fireEvent.click(currentVideo);
    expect(onQueueModeChange).toHaveBeenCalledWith("single");
    fireEvent.click(wholePlaylist);
    expect(onQueueModeChange).toHaveBeenCalledWith("playlist");
  });

  it("현재 영상이 없는 재생목록은 단일 영상 선택을 비활성화한다", () => {
    renderFields("queueMode", {
      playlistDetected: true,
      singleTrackAvailable: false,
    });

    expect(
      screen.getByRole("radio", { name: /현재 영상만 추가/ }),
    ).toBeDisabled();
    expect(
      screen.getByText("현재 영상 정보가 없는 링크입니다."),
    ).toBeInTheDocument();
    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-describedby",
      "add-track-error",
    );
  });
});
