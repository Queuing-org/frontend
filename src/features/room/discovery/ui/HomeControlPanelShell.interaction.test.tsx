import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HomeControlPanelShell, { type HomeMenuItem } from "./HomeControlPanelShell";

describe("HomeControlPanelShell 메뉴", () => {
  it.each(["CREATE", "FOLLOW", "SETTING"] as const)(
    "%s 메뉴 클릭을 전달한다",
    async (menuItem) => {
      const user = userEvent.setup();
      const onSelectMenuItem = vi.fn<(item: HomeMenuItem) => void>();
      render(
        <HomeControlPanelShell
          variant="menu"
          onSelectMenuItem={onSelectMenuItem}
        />,
      );
      const button = screen.getByRole("button", { name: menuItem });

      await user.click(button);
      expect(onSelectMenuItem).toHaveBeenCalledWith(menuItem);
    },
  );
});
