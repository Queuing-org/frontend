import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { deleteMyQueueEntry } from "./deleteMyQueueEntry";
import { deleteRoomQueueEntries } from "./deleteRoomQueueEntries";
import { moveRoomQueueEntry } from "./moveRoomQueueEntry";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { delete: vi.fn(), patch: vi.fn() },
}));

describe("queue-entries mutation 계약", () => {
  beforeEach(() => vi.clearAllMocks());

  it("단건 삭제는 DELETE 204 body를 파싱하지 않는다", async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValue({ data: { result: false } });
    await expect(deleteMyQueueEntry({ slug: "room", entryId: "entry/1" })).resolves.toBeUndefined();
    expect(axiosInstance.delete).toHaveBeenCalledWith(
      "/api/v1/rooms/room/queue-entries/entry%2F1",
      { headers: undefined },
    );
  });

  it("다건 삭제는 DELETE config.data로 entryIds를 보낸다", async () => {
    await deleteRoomQueueEntries({ slug: "room", entryIds: ["a", "b"] });
    expect(axiosInstance.delete).toHaveBeenCalledWith(
      "/api/v1/rooms/room/queue-entries",
      { data: { entryIds: ["a", "b"] }, headers: undefined },
    );
  });

  it("이동은 entry 경로 PATCH body에 beforeEntryId만 보낸다", async () => {
    await moveRoomQueueEntry({ slug: "room", movedEntryId: "a", beforeEntryId: null });
    expect(axiosInstance.patch).toHaveBeenCalledWith(
      "/api/v1/rooms/room/queue-entries/a",
      { beforeEntryId: null },
      { headers: undefined },
    );
  });
});
