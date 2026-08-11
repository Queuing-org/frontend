export type CreateRoomPayload = {
  title: string;
  password?: string;
  tags?: string[];
  maxParticipants?: number | null;
  trackLimitMinutes?: number | null;
  thumbnailUploadToken?: string;
};

export type CreateRoomResult = {
  slug: string;
};

export type RandomEntryRoomResult = {
  slug: string;
};

export type UpdateRoomPayload = {
  title: string;
  password?: string | null;
  tags?: string[];
  maxParticipants?: number | null;
};

export type UpdateRoomParams = {
  slug: string;
  payload: UpdateRoomPayload;
};

export type UpdateRoomResult = {
  success: boolean;
};

export type UpdateRoomThumbnailParams = {
  slug: string;
  thumbnailUploadToken: string;
};

export type UpdateRoomThumbnailResult = {
  success: boolean;
};

export type DeleteRoomParams = {
  slug: string;
};

export type DeleteRoomResult = {
  success: boolean;
};
