import type { UpdateRoomPayload } from "@/src/features/room/api/types";

type BuildUpdateRoomPayloadParams = {
  initialMaxParticipants: number | null;
  initialTagSlugs: string[];
  initialTrackLimitMinutes: number | null;
  initialTitle: string;
  isPasswordClearEnabled: boolean;
  isPasswordChangeEnabled: boolean;
  maxParticipants: number | null;
  password: string;
  selectedTagSlugs: string[];
  trackLimitMinutes: number | null;
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
  initialTrackLimitMinutes,
  initialTitle,
  isPasswordClearEnabled,
  isPasswordChangeEnabled,
  maxParticipants,
  password,
  selectedTagSlugs,
  trackLimitMinutes,
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

  if (trackLimitMinutes !== initialTrackLimitMinutes) {
    changedFields.trackLimitMinutes = trackLimitMinutes;
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
