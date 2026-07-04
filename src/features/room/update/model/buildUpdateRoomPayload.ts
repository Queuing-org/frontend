import type { UpdateRoomPayload } from "@/src/features/room/api/types";

type BuildUpdateRoomPayloadParams = {
  initialMaxParticipants: number | null;
  initialTagSlugs: string[];
  initialTitle: string;
  isPasswordClearEnabled: boolean;
  isPasswordChangeEnabled: boolean;
  maxParticipants: number | null;
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
  initialMaxParticipants,
  initialTagSlugs,
  initialTitle,
  isPasswordClearEnabled,
  isPasswordChangeEnabled,
  maxParticipants,
  password,
  selectedTagSlugs,
  title,
}: BuildUpdateRoomPayloadParams): UpdateRoomPayload | null {
  const trimmedTitle = title.trim();
  const trimmedPassword = password.trim();
  const changedFields: Partial<Omit<UpdateRoomPayload, "title">> = {};

  if (!haveSameItems(selectedTagSlugs, initialTagSlugs)) {
    changedFields.tags = selectedTagSlugs;
  }

  if (isPasswordClearEnabled) {
    changedFields.password = null;
  } else if (isPasswordChangeEnabled && trimmedPassword) {
    changedFields.password = trimmedPassword;
  }

  if (maxParticipants !== initialMaxParticipants) {
    changedFields.maxParticipants = maxParticipants;
  }

  const hasChangedFields = Object.keys(changedFields).length > 0;
  if (trimmedTitle === initialTitle.trim() && !hasChangedFields) {
    return null;
  }

  return {
    title: trimmedTitle,
    ...changedFields,
  };
}
