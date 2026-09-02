import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AddTrackFormFields from "./AddTrackFormFields";

function renderFields(errorField: "url" | "story") {
  render(
    <AddTrackFormFields
      errorField={errorField}
      errorMessage="입력을 확인해 주세요."
      onChange={vi.fn()}
      onStoryChange={vi.fn()}
      storyLength={0}
      storyMaxLength={30}
      storyValue=""
      submitting={false}
      value=""
    />,
  );
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
});
