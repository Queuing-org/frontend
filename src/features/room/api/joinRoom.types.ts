import { ApiError } from "@/src/shared/api/api-error";
import type { RoomJoinedData } from "../model/types";

export type JoinRoomPayload =
  | { password?: string | null; accessToken?: never }
  | { accessToken: string; password?: never };

export type JoinRoomResult = {
  roomSlug: string;
  timestamp: number;
  data: RoomJoinedData;
};

export type RoomJoinErrorRoom = {
  slug?: string;
  title?: string;
};

export class RoomJoinError extends ApiError {
  data: RoomJoinErrorRoom | null;

  constructor(args: {
    status: number;
    message: string;
    code?: string;
    data?: RoomJoinErrorRoom | null;
  }) {
    super(args);
    this.name = "RoomJoinError";
    this.data = args.data ?? null;
  }
}
