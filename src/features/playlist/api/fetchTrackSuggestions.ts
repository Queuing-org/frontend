import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { unwrapApiResponse } from "@/src/shared/api/api-response";
import type { ApiResponse } from "@/src/shared/api/types";
import type {
  FrequentTrack,
  TrackSuggestionPage,
  YouTubeVideo,
} from "../model/trackSuggestions";

export async function fetchFrequentTracks(signal?: AbortSignal) {
  const { data } = await axiosInstance.get<
    ApiResponse<TrackSuggestionPage<FrequentTrack>>
  >("/api/v1/user-profiles/me/frequent-tracks", { signal });
  return unwrapApiResponse(data).items.slice(0, 8);
}
export async function searchYouTubeVideos(query: string, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<
    ApiResponse<TrackSuggestionPage<YouTubeVideo>>
  >("/api/v1/youtube/videos", { params: { query, size: 8 }, signal });
  return unwrapApiResponse(data).items.slice(0, 8);
}
