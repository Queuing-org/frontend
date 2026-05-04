export type CreateRoomPayload = {
  title: string;
  password?: string;
  tags?: string[];
};

export type CreateRoomResult = {
  slug: string;
};

export type UpdateRoomPayload = {
  title?: string;
  password?: string;
  tags?: string[];
};

export type UpdateRoomParams = {
  slug: string;
  payload: UpdateRoomPayload;
};

export type UpdateRoomResult = {
  success: boolean;
};
