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
  it("URL 오류를 URL 입력의 aria-invalid와 SR 설명에 연결한다", () => {
    renderFields("url");

    const input = screen.getByPlaceholderText(
      "함께 듣고 싶은 영상의 URL을 붙여넣으세요",
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "add-track-error");
  });

  it("사연 오류를 사연 입력의 aria-invalid와 SR 설명에 연결한다", () => {
    renderFields("story");

    const textarea = screen.getByPlaceholderText(
      "함께 듣고 싶은 이유나 전하고 싶은 말을 적어주세요",
    );
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute("aria-describedby", "add-track-error");
  });
});
