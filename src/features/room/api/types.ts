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
  title?: string;
  password?: string | null;
  tags?: string[];
  maxParticipants?: number | null;
  trackLimitMinutes?: number | null;
};

export type UpdateRoomParams = {
  accessToken: string;
  slug: string;
  payload: UpdateRoomPayload;
};

export type UpdateRoomResult = {
  success: boolean;
};

export type UpdateRoomThumbnailParams = {
  accessToken: string;
  slug: string;
  thumbnailUploadToken: string;
};

export type UpdateRoomThumbnailResult = {
  success: boolean;
};

export type DeleteRoomThumbnailParams = {
  accessToken: string;
  slug: string;
};

export type DeleteRoomThumbnailResult = {
  success: boolean;
};

export type DeleteRoomParams = {
  accessToken: string;
  slug: string;
};

export type DeleteRoomResult = {
  success: boolean;
};
