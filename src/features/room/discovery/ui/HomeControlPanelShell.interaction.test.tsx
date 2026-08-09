import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HomeControlPanelShell, { type HomeMenuItem } from "./HomeControlPanelShell";

describe("HomeControlPanelShell 메뉴 선로딩 intent", () => {
  it.each(["CREATE", "FOLLOW", "SETTING"] as const)(
    "%s 메뉴의 hover, focus, pointer down을 전달하고 클릭 동작을 유지한다",
    async (menuItem) => {
      const user = userEvent.setup();
      const onMenuItemIntent = vi.fn();
      const onSelectMenuItem = vi.fn<(item: HomeMenuItem) => void>();
      render(
        <HomeControlPanelShell
          variant="menu"
          onMenuItemIntent={onMenuItemIntent}
          onSelectMenuItem={onSelectMenuItem}
        />,
      );
      const button = screen.getByRole("button", { name: menuItem });

      fireEvent.pointerEnter(button);
      fireEvent.focus(button);
      fireEvent.pointerDown(button);
      expect(onMenuItemIntent).toHaveBeenNthCalledWith(1, menuItem);
      expect(onMenuItemIntent).toHaveBeenNthCalledWith(2, menuItem);
      expect(onMenuItemIntent).toHaveBeenNthCalledWith(3, menuItem);

      await user.click(button);
      expect(onSelectMenuItem).toHaveBeenCalledWith(menuItem);
    },
  );
});
