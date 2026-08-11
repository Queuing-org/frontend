import {
  getDesktopViewportDensity,
  MOBILE_VIEWPORT_MAX_WIDTH,
  type ViewportSize,
} from "@/src/shared/lib/viewportDensity";

export const ROOM_CHAT_MIN_VISIBLE_ROWS = 6;
export const ROOM_CHAT_SUPPORTED_MIN_HEIGHT = 600;

const NORMAL_CHAT_ROW_HEIGHT = 48;
const NORMAL_CHAT_ROW_GAP = 16;
const NORMAL_CHAT_LIST_PADDING_Y = 28;
const NORMAL_REQUESTER_CARD_HEIGHT = 84;
const NORMAL_ROOM_CHROME_HEIGHT = 238;
const COMPACT_ROOM_CHROME_HEIGHT = 190.4;
const NORMAL_PANEL_CONTENT_WIDTH = 640;
const COMPACT_PANEL_CONTENT_WIDTH = 512;
const MIN_PLAYER_WIDTH_WITH_REQUESTER = 160;
const MIN_PLAYER_WIDTH_WITHOUT_REQUESTER = 240;

export type RoomChatLayout = {
  availableChatHeight: number;
  chatDensity: number;
  chatMinHeight: number;
  requesterCardHeight: number;
  songStackWidth: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function interpolate(
  value: number,
  inputStart: number,
  inputEnd: number,
  outputStart: number,
  outputEnd: number,
) {
  const progress = (value - inputStart) / (inputEnd - inputStart);
  return outputStart + (outputEnd - outputStart) * progress;
}

export function getRoomChatDensity(viewportHeight: number) {
  if (viewportHeight <= ROOM_CHAT_SUPPORTED_MIN_HEIGHT) {
    return 0.64;
  }

  if (viewportHeight <= 900) {
    return interpolate(viewportHeight, 600, 900, 0.64, 0.8);
  }

  if (viewportHeight < 1100) {
    return interpolate(viewportHeight, 900, 1100, 0.8, 1);
  }

  return 1;
}

export function getRoomChatLayout(
  viewportSize: ViewportSize,
  hasRequester: boolean,
): RoomChatLayout {
  if (viewportSize.width <= MOBILE_VIEWPORT_MAX_WIDTH) {
    return {
      availableChatHeight: 0,
      chatDensity: 1,
      chatMinHeight: 0,
      requesterCardHeight: hasRequester
        ? NORMAL_REQUESTER_CARD_HEIGHT
        : 0,
      songStackWidth: NORMAL_PANEL_CONTENT_WIDTH,
    };
  }

  const chatDensity = getRoomChatDensity(viewportSize.height);
  const chatMinHeight =
    (NORMAL_CHAT_ROW_HEIGHT * ROOM_CHAT_MIN_VISIBLE_ROWS +
      NORMAL_CHAT_ROW_GAP * (ROOM_CHAT_MIN_VISIBLE_ROWS - 1) +
      NORMAL_CHAT_LIST_PADDING_Y) *
    chatDensity;
  const requesterCardHeight = hasRequester
    ? NORMAL_REQUESTER_CARD_HEIGHT * chatDensity
    : 0;
  const isCompact =
    getDesktopViewportDensity(viewportSize) === "compact";
  const roomChromeHeight = isCompact
    ? COMPACT_ROOM_CHROME_HEIGHT
    : NORMAL_ROOM_CHROME_HEIGHT;
  const panelContentWidth = isCompact
    ? COMPACT_PANEL_CONTENT_WIDTH
    : NORMAL_PANEL_CONTENT_WIDTH;
  const minPlayerWidth = hasRequester
    ? MIN_PLAYER_WIDTH_WITH_REQUESTER
    : MIN_PLAYER_WIDTH_WITHOUT_REQUESTER;
  const availablePlayerHeight = Math.max(
    0,
    viewportSize.height * 0.98 -
      roomChromeHeight -
      chatMinHeight -
      requesterCardHeight,
  );
  const songStackWidth = clamp(
    (availablePlayerHeight * 16) / 9,
    minPlayerWidth,
    panelContentWidth,
  );
  const playerHeight = (songStackWidth * 9) / 16;
  const availableChatHeight =
    viewportSize.height * 0.98 -
    roomChromeHeight -
    requesterCardHeight -
    playerHeight;

  return {
    availableChatHeight,
    chatDensity,
    chatMinHeight,
    requesterCardHeight,
    songStackWidth,
  };
}
