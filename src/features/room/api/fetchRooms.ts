import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type { RoomsResponse } from "../model/types";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import { ApiResponse } from "@/src/shared/api/types";

export type FetchRoomsParams = {
  lastId?: number;
  size?: number;
};

export async function fetchRooms({
  lastId,
  size,
}: FetchRoomsParams = {}): Promise<RoomsResponse> {
  const res = await axiosInstance.get<ApiResponse<RoomsResponse>>(
    "/api/v1/rooms",
    {
      params: {
        ...(typeof lastId === "number" ? { lastId } : {}),
        ...(typeof size === "number" ? { size } : {}),
      },
    },
  );

  return unwrapApiResponse(res.data);
}
