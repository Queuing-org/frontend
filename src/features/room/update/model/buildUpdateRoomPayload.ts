import type { UpdateRoomPayload } from "@/src/features/room/api/types";

type BuildUpdateRoomPayloadParams = {
  initialTagSlugs: string[];
  initialTitle: string;
  isPasswordChangeEnabled: boolean;
  password: string;
  selectedTagSlugs: string[];
  title: string;
};

function haveSameItems(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const rightItems = new Set(right);

  return left.every((item) => rightItems.has(item));
}

export function buildUpdateRoomPayload({
  initialTagSlugs,
  initialTitle,
  isPasswordChangeEnabled,
  password,
  selectedTagSlugs,
  title,
}: BuildUpdateRoomPayloadParams): UpdateRoomPayload | null {
  const trimmedTitle = title.trim();
  const trimmedPassword = password.trim();
  const payload: UpdateRoomPayload = {};

  if (!haveSameItems(selectedTagSlugs, initialTagSlugs)) {
    payload.tags = selectedTagSlugs;
  }

  if (isPasswordChangeEnabled && trimmedPassword) {
    payload.password = trimmedPassword;
  }

  if (trimmedTitle !== initialTitle.trim() || Object.keys(payload).length > 0) {
    payload.title = trimmedTitle;
  }

  return Object.keys(payload).length > 0 ? payload : null;
}
