"use client";

import { useRef } from "react";
import Draggable from "react-draggable";
import type { DraggableData } from "react-draggable";
import type {
  FloatingWidgetsView,
  WidgetId,
} from "@/src/features/room/floating/model/useFloatingWidgetsState";
import type { PlaylistParticipant } from "@/src/features/playlist/model/types";
import type { RoomMeta } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import type { CurrentRequesterProfile } from "@/src/features/room/profile/model/types";
import RoomProfilePanel from "@/src/features/room/profile/ui/RoomProfilePanel";
import RoomQueuePanel from "@/src/features/room/queue/ui/RoomQueuePanel";
import RoomParticipantsPanel from "@/src/features/room/participants/ui/RoomParticipantsPanel";
import RoomChatComposer from "@/src/features/room/chat/ui/RoomChatComposer";
import FloatingRoomPanelShell from "./FloatingRoomPanelShell";
import styles from "./RoomFloatingWidgets.module.css";

type Props = {
  chatDisabledReason?: string;
  chatErrorMessage?: string;
  currentRequester: CurrentRequesterProfile | null;
  currentTrackTitle?: string | null;
  currentUser: User | null;
  isChatSending: boolean;
  isCurrentUserLoading: boolean;
  onChatLoginClick?: () => void;
  onSendChatMessage: (message: string) => boolean;
  onActivateWidget: (widgetId: WidgetId) => void;
  onWidgetStop: (widgetId: WidgetId, data: DraggableData) => void;
  participants: PlaylistParticipant[];
  roomMeta: RoomMeta | null;
  roomPassword?: string | null;
  roomSlug: string;
  widgets: FloatingWidgetsView;
};

export default function RoomFloatingWidgets({
  chatDisabledReason,
  chatErrorMessage,
  currentRequester,
  currentTrackTitle,
  currentUser,
  isChatSending,
  isCurrentUserLoading,
  onChatLoginClick,
  onSendChatMessage,
  onActivateWidget,
  onWidgetStop,
  participants,
  roomMeta,
  roomPassword,
  roomSlug,
  widgets,
}: Props) {
  const profileWidgetRef = useRef<HTMLDivElement>(null);
  const queueWidgetRef = useRef<HTMLDivElement>(null);
  const chatWidgetRef = useRef<HTMLDivElement>(null);
  const participantsWidgetRef = useRef<HTMLDivElement>(null);

  return (
    <div className={styles.widgetLayer}>
      {widgets.profile.isOpen ? (
        <div
          className={styles.widget}
          onMouseDown={() => onActivateWidget("profile")}
          style={{
            ...widgets.profile.placementStyle,
            zIndex: widgets.profile.zIndex,
          }}
        >
          <Draggable
            bounds={widgets.profile.bounds}
            defaultPosition={widgets.profile.offset}
            handle="[data-drag-handle='true']"
            nodeRef={profileWidgetRef}
            onStop={(_, data) => onWidgetStop("profile", data)}
          >
            <div ref={profileWidgetRef} className={styles.widgetFrame}>
              <FloatingRoomPanelShell
                contentClassName={styles.profilePanelContent}
                height={widgets.profile.height}
                width={widgets.profile.width}
              >
                <RoomProfilePanel
                  currentRequester={currentRequester}
                  currentTrackTitle={currentTrackTitle}
                />
              </FloatingRoomPanelShell>
            </div>
          </Draggable>
        </div>
      ) : null}
      {widgets.participants.isOpen ? (
        <div
          className={styles.widget}
          onMouseDown={() => onActivateWidget("participants")}
          style={{
            ...widgets.participants.placementStyle,
            zIndex: widgets.participants.zIndex,
          }}
        >
          <Draggable
            bounds={widgets.participants.bounds}
            defaultPosition={widgets.participants.offset}
            handle="[data-drag-handle='true']"
            nodeRef={participantsWidgetRef}
            onStop={(_, data) => onWidgetStop("participants", data)}
          >
            <div ref={participantsWidgetRef} className={styles.widgetFrame}>
              <FloatingRoomPanelShell
                contentClassName={styles.participantsPanelContent}
                height={widgets.participants.height}
                width={widgets.participants.width}
              >
                <RoomParticipantsPanel
                  currentUser={currentUser}
                  participants={participants}
                  roomMeta={roomMeta}
                  roomPassword={roomPassword}
                  roomSlug={roomSlug}
                />
              </FloatingRoomPanelShell>
            </div>
          </Draggable>
        </div>
      ) : null}
      {widgets.queue.isOpen ? (
        <div
          className={styles.widget}
          onMouseDown={() => onActivateWidget("queue")}
          style={{
            ...widgets.queue.placementStyle,
            zIndex: widgets.queue.zIndex,
          }}
        >
          <Draggable
            bounds={widgets.queue.bounds}
            defaultPosition={widgets.queue.offset}
            handle="[data-drag-handle='true']"
            nodeRef={queueWidgetRef}
            onStop={(_, data) => onWidgetStop("queue", data)}
          >
            <div ref={queueWidgetRef} className={styles.widgetFrame}>
              <FloatingRoomPanelShell
                contentClassName={styles.queuePanelContent}
                height={widgets.queue.height}
                width={widgets.queue.width}
              >
                <RoomQueuePanel
                  currentUser={currentUser}
                  isCurrentUserLoading={isCurrentUserLoading}
                  roomMeta={roomMeta}
                  roomPassword={roomPassword}
                  roomSlug={roomSlug}
                />
              </FloatingRoomPanelShell>
            </div>
          </Draggable>
        </div>
      ) : null}
      {widgets.chat.isOpen ? (
        <div
          className={styles.widget}
          onMouseDown={() => onActivateWidget("chat")}
          style={{
            ...widgets.chat.placementStyle,
            zIndex: widgets.chat.zIndex,
          }}
        >
          <Draggable
            bounds={widgets.chat.bounds}
            defaultPosition={widgets.chat.offset}
            handle="[data-drag-handle='true']"
            nodeRef={chatWidgetRef}
            onStop={(_, data) => onWidgetStop("chat", data)}
          >
            <div ref={chatWidgetRef} className={styles.widgetFrame}>
              <FloatingRoomPanelShell
                compactHeader
                contentClassName={styles.chatPanelContent}
                height={widgets.chat.height}
                width={widgets.chat.width}
              >
                <RoomChatComposer
                  disabledReason={chatDisabledReason}
                  errorMessage={chatErrorMessage}
                  isSending={isChatSending}
                  onLoginClick={onChatLoginClick}
                  onSendMessage={onSendChatMessage}
                  showLoginAction={Boolean(onChatLoginClick)}
                />
              </FloatingRoomPanelShell>
            </div>
          </Draggable>
        </div>
      ) : null}
    </div>
  );
}
