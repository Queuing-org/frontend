import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { expect, it, vi } from "vitest";
import { useEditRoomForm } from "./useEditRoomForm";

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
