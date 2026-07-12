import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

function TestButton() {
  const [clicked, setClicked] = useState(false);

  return (
    <button type="button" onClick={() => setClicked(true)}>
      {clicked ? "완료" : "실행"}
    </button>
  );
}

describe("프론트 컴포넌트 테스트 환경", () => {
  it("jsdom에서 사용자 상호작용과 jest-dom matcher를 지원한다", async () => {
    const user = userEvent.setup();

    render(<TestButton />);
    await user.click(screen.getByRole("button", { name: "실행" }));

    expect(screen.getByRole("button", { name: "완료" })).toBeInTheDocument();
  });
});
